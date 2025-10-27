import { NextResponse } from 'next/server';
import { GitHubClient } from '@/lib/github';
import { RepoService } from '@/lib/database/repos';
import { TagService } from '@/lib/database/tags';
import { RepoAnalyzer } from '@/lib/ai';
import { analysisStateManager } from '@/lib/analysis-state';
import { deduplicateAndNormalizeTags } from '@/lib/utils';

export async function POST() {
  try {
    const state = analysisStateManager.getState();
    
    // 如果已经在运行，返回当前状态
    if (state.isRunning) {
      return NextResponse.json({
        message: '分析已在进行中',
        progress: state.progress
      });
    }

    // 检查配置
    const githubClient = new GitHubClient();
    if (!githubClient.isConfigured()) {
      return NextResponse.json(
        { error: 'GitHub 服务未配置' },
        { status: 400 }
      );
    }

    const analyzer = new RepoAnalyzer();
    if (!analyzer.isAvailable()) {
      return NextResponse.json(
        { error: 'AI 服务未配置' },
        { status: 400 }
      );
    }

    // 启动分析（异步执行）
    startAnalysisProcess();

    return NextResponse.json({
      message: '分析已启动',
      progress: analysisStateManager.getState().progress
    });

  } catch (error) {
    console.error('启动分析失败:', error);
    return NextResponse.json(
      { 
        error: '启动分析失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

async function startAnalysisProcess() {
  analysisStateManager.setRunning(true);
  analysisStateManager.setError(null);
  analysisStateManager.setProgress({
    current: 0,
    total: 0,
    status: '正在获取GitHub仓库...',
    completed: 0,
    failed: 0,
    processing: []
  });

  try {
    const githubClient = new GitHubClient();
    const analyzer = new RepoAnalyzer();

    // 获取所有星标仓库
    analysisStateManager.setProgress({ status: '正在获取GitHub星标仓库...' });
    const starredRepos = await githubClient.getAllStarredRepos();
    
    analysisStateManager.setProgress({ 
      total: starredRepos.length,
      current: 0,
      completed: 0,
      failed: 0,
      processing: []
    });

    // 并发控制参数
    const CONCURRENT_LIMIT = 5; // 同时处理的最大仓库数量
    const semaphore = new Semaphore(CONCURRENT_LIMIT);

    // 创建分析任务
    const analysisTasks = starredRepos.map(repo => 
      analyzeRepoWithSemaphore(semaphore, repo, githubClient, analyzer)
    );

    // 等待所有任务完成
    await Promise.allSettled(analysisTasks);

    analysisStateManager.setProgress({ status: 'completed' });
    console.log('所有仓库分析完成');

  } catch (error) {
    console.error('分析过程出错:', error);
    analysisStateManager.setError(error instanceof Error ? error.message : '分析失败');
    analysisStateManager.setProgress({ status: 'error' });
  } finally {
    analysisStateManager.setRunning(false);
  }
}

// 信号量类，用于控制并发数量
class Semaphore {
  private permits: number;
  private waiting: (() => void)[] = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }

    return new Promise(resolve => {
      this.waiting.push(resolve);
    });
  }

  release(): void {
    this.permits++;
    if (this.waiting.length > 0) {
      const resolve = this.waiting.shift()!;
      this.permits--;
      resolve();
    }
  }
}

// 使用信号量控制的分析函数
async function analyzeRepoWithSemaphore(
  semaphore: Semaphore,
  repo: { full_name: string; name: string; owner: { login: string }; description?: string | null; language?: string | null; stargazers_count: number; forks_count: number; html_url: string },
  githubClient: GitHubClient,
  analyzer: RepoAnalyzer
): Promise<void> {
  await semaphore.acquire();
  
  try {
    analysisStateManager.addProcessing(repo.full_name);
    analysisStateManager.setProgress({ 
      status: `正在分析仓库: ${repo.full_name} (${analysisStateManager.getState().progress.processing.length}个并行)`
    });

    // 检查仓库是否已存在
    const existingRepo = await RepoService.findByFullName(repo.full_name);
    if (existingRepo) {
      console.log(`仓库 ${repo.full_name} 已存在，跳过`);
      analysisStateManager.incrementCompleted();
      return;
    }

    // 获取仓库详细信息（用于验证仓库存在性）
    await githubClient.getRepo(repo.owner.login, repo.name);
    
    // 获取README内容（支持多种格式）
    let readmeContent = '';
    const readmeFiles = ['README.md', 'README.rst', 'README.txt', 'README', 'readme.md', 'readme.rst', 'readme.txt', 'readme'];
    
    for (const readmeFile of readmeFiles) {
      try {
        const readme = await githubClient.getFileContent(repo.owner.login, repo.name, readmeFile);
        if (readme && readme.content) {
          // 解码 base64 内容
          readmeContent = Buffer.from(readme.content, 'base64').toString('utf-8');
          console.log(`成功获取 ${repo.full_name} 的 ${readmeFile}`);
          break;
        }
      } catch {
        // 继续尝试下一个文件
        continue;
      }
    }
    
    if (!readmeContent) {
      console.log(`仓库 ${repo.full_name} 没有找到任何 README 文件`);
    }

    // 获取文件结构（增强版，优先获取重要文件）
    let fileStructure: string[] = [];
    let importantFiles: string[] = [];
    
    try {
      const tree = await githubClient.getRepoTree(repo.owner.login, repo.name, 'HEAD', true);
      
      // 定义重要文件模式
      const importantPatterns = [
        /package\.json$/i,
        /requirements\.txt$/i,
        /pom\.xml$/i,
        /Cargo\.toml$/i,
        /composer\.json$/i,
        /Gemfile$/i,
        /Dockerfile$/i,
        /docker-compose\.yml$/i,
        /Makefile$/i,
        /CMakeLists\.txt$/i,
        /\.github\/workflows\//i,
        /tsconfig\.json$/i,
        /webpack\.config\./i,
        /vite\.config\./i,
        /next\.config\./i,
        /nuxt\.config\./i,
        /\.env\.example$/i,
        /README/i,
        /LICENSE/i,
        /CHANGELOG/i,
        /CONTRIBUTING/i
      ];
      
      // 分离重要文件和普通文件
      const allFiles = tree.map(item => item.path);
      importantFiles = allFiles.filter(path => 
        importantPatterns.some(pattern => pattern.test(path))
      );
      
      // 获取其他文件（排除重要文件）
      const otherFiles = allFiles.filter(path => 
        !importantPatterns.some(pattern => pattern.test(path))
      );
      
      // 优先显示重要文件，然后显示其他文件（限制总数）
      fileStructure = [
        ...importantFiles.slice(0, 20), // 最多20个重要文件
        ...otherFiles.slice(0, 30)      // 最多30个其他文件
      ];
      
      console.log(`获取 ${repo.full_name} 文件结构: ${allFiles.length} 个文件，其中 ${importantFiles.length} 个重要文件`);
      
    } catch (error) {
      console.log(`无法获取 ${repo.full_name} 的文件结构:`, error);
    }

    // AI分析
    const analysisResult = await analyzer.analyzeRepo({
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description || undefined,
      language: repo.language || undefined,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      url: repo.html_url,
      readmeContent,
      fileStructure
    });

    if (analysisResult.success && analysisResult.data) {
      // 使用工具函数进行标签去重和标准化
      const uniqueTags = deduplicateAndNormalizeTags(analysisResult.data.tags);

      // 将标签保存到 tags 表
      if (uniqueTags.length > 0) {
        await TagService.createMany(uniqueTags);
      }

      // 保存仓库到数据库
      await RepoService.create({
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description || '',
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language || undefined,
        url: repo.html_url,
        aiDescription: analysisResult.data.description,
        tags: uniqueTags
      });

      // 详细日志记录
      const hasReadme = !!readmeContent;
      const fileCount = fileStructure.length;
      const importantFileCount = importantFiles.length;
      const confidence = analysisResult.data.confidence || 0;
      
      console.log(`✅ 成功分析并保存仓库: ${repo.full_name}`);
      console.log(`   - README: ${hasReadme ? '有' : '无'}`);
      console.log(`   - 文件总数: ${fileCount} (重要文件: ${importantFileCount})`);
      console.log(`   - AI置信度: ${(confidence * 100).toFixed(1)}%`);
      console.log(`   - 生成标签: ${uniqueTags.join(', ')}`);
      console.log(`   - AI描述: ${analysisResult.data.description.substring(0, 100)}${analysisResult.data.description.length > 100 ? '...' : ''}`);
      
      analysisStateManager.incrementCompleted();
    } else {
      console.error(`❌ 分析仓库失败: ${repo.full_name}`);
      console.error(`   - 错误信息: ${analysisResult.error}`);
      console.error(`   - README状态: ${readmeContent ? '有' : '无'}`);
      console.error(`   - 文件结构: ${fileStructure.length} 个文件`);
      analysisStateManager.incrementFailed();
    }

  } catch (error) {
    console.error(`处理仓库 ${repo.full_name} 时出错:`, error);
    analysisStateManager.incrementFailed();
  } finally {
    analysisStateManager.removeProcessing(repo.full_name);
    semaphore.release();
  }
}

// 获取分析进度
export async function GET() {
  const state = analysisStateManager.getState();
  return NextResponse.json({
    isRunning: state.isRunning,
    progress: state.progress,
    error: state.error
  });
}
