import { NextRequest, NextResponse } from 'next/server';
import { GitHubClient } from '@/lib/github';
import { RepoService } from '@/lib/database/repos';
import { TagService } from '@/lib/database/tags';
import { CustomTagService } from '@/lib/database/custom-tags';
import { RepoAnalyzer } from '@/lib/ai';
import { analysisStateManager } from '@/lib/analysis-state';

export async function POST(request: NextRequest) {
  try {
    // 验证密码
    const body = await request.json().catch(() => ({}));
    const providedPassword = body.password;
    const expectedPassword = process.env.OPERATION_PASSWORD;

    if (!expectedPassword) {
      return NextResponse.json(
        { error: '操作密码未配置' },
        { status: 500 }
      );
    }

    if (providedPassword !== expectedPassword) {
      return NextResponse.json(
        { error: '密码错误' },
        { status: 401 }
      );
    }

    const state = analysisStateManager.getState();
    
    // 如果已经在运行，返回当前状态
    if (state.isRunning) {
      return NextResponse.json({
        message: '分析已在进行中',
        progress: state.progress
      });
    }

    // 检查数据库是否有仓库
    const reposInDb = await RepoService.findAll();
    if (reposInDb.length === 0) {
      return NextResponse.json(
        { error: '数据库中没有仓库，请先进行同步' },
        { status: 400 }
      );
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
  // 重置停止状态
  analysisStateManager.reset();
  analysisStateManager.setRunning(true);
  analysisStateManager.setError(null);
  analysisStateManager.setProgress({
    current: 0,
    total: 0,
    status: '正在获取数据库仓库...',
    completed: 0,
    failed: 0,
    processing: []
  });

  try {
    const githubClient = new GitHubClient();
    const analyzer = new RepoAnalyzer();

    // 从数据库获取所有未删除的仓库
    analysisStateManager.setProgress({ status: '正在从数据库获取仓库...' });
    const reposInDb = await RepoService.findAll();
    
    // 过滤掉已经有 AI 分析数据的仓库
    const reposToAnalyze = reposInDb.filter(repo => !repo.aiDescription || repo.aiDescription.trim() === '');
    
    if (reposToAnalyze.length === 0) {
      analysisStateManager.setProgress({ 
        status: '所有仓库都已分析完成',
        current: reposInDb.length,
        total: reposInDb.length,
        completed: reposInDb.length,
        failed: 0
      });
      console.log('所有仓库都已分析完成，无需分析');
      await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒让用户看到消息
      analysisStateManager.setProgress({ status: 'completed' });
      return;
    }
    
    analysisStateManager.setProgress({ 
      status: `找到 ${reposToAnalyze.length} 个需要分析的仓库`,
      total: reposToAnalyze.length,
      current: 0,
      completed: 0,
      failed: 0,
      processing: []
    });

    // 并发控制参数
    const CONCURRENT_LIMIT = 5; // 同时处理的最大仓库数量
    const semaphore = new Semaphore(CONCURRENT_LIMIT);

    // 创建分析任务
    const analysisTasks = reposToAnalyze.map(repo => 
      analyzeRepoFromDb(semaphore, repo, githubClient, analyzer)
    );

    // 等待所有任务完成
    await Promise.allSettled(analysisTasks);

    // 检查是否已停止
    if (analysisStateManager.isStopped()) {
      console.log('分析已停止');
      analysisStateManager.setProgress({ status: '已停止' });
    } else {
      analysisStateManager.setProgress({ status: 'completed' });
      console.log('所有仓库分析完成');
    }

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

// 从数据库分析仓库的函数
async function analyzeRepoFromDb(
  semaphore: Semaphore,
  repo: Awaited<ReturnType<typeof RepoService.findAll>>[0],
  githubClient: GitHubClient,
  analyzer: RepoAnalyzer
): Promise<void> {
  await semaphore.acquire();
  
  try {
    // 检查是否已停止
    if (analysisStateManager.isStopped()) {
      return;
    }
    
    analysisStateManager.addProcessing(repo.fullName);
    analysisStateManager.setProgress({ 
      status: `正在分析仓库: ${repo.fullName} (${analysisStateManager.getState().progress.processing.length}个并行)`
    });

    // 再次检查是否已停止（在开始处理前）
    if (analysisStateManager.isStopped()) {
      return;
    }

    // 解析仓库名称获取 owner 和 name
    const [owner, repoName] = repo.fullName.split('/');
    if (!owner || !repoName) {
      console.error(`仓库名称格式错误: ${repo.fullName}`);
      analysisStateManager.incrementFailed();
      return;
    }
    
    // 获取README内容（支持多种格式）
    let readmeContent = '';
    const readmeFiles = ['README.md', 'README.rst', 'README.txt', 'README', 'readme.md', 'readme.rst', 'readme.txt', 'readme'];
    
    for (const readmeFile of readmeFiles) {
      // 检查是否已停止
      if (analysisStateManager.isStopped()) {
        return;
      }
      
      try {
        const readme = await githubClient.getFileContent(owner, repoName, readmeFile);
        if (readme && readme.content) {
          // 解码 base64 内容
          readmeContent = Buffer.from(readme.content, 'base64').toString('utf-8');
          console.log(`成功获取 ${repo.fullName} 的 ${readmeFile}`);
          break;
        }
      } catch {
        // 继续尝试下一个文件
        continue;
      }
    }
    
    if (!readmeContent) {
      console.log(`仓库 ${repo.fullName} 没有找到任何 README 文件`);
    }

    // 检查是否已停止
    if (analysisStateManager.isStopped()) {
      return;
    }

    // 获取文件结构（增强版，优先获取重要文件）
    let fileStructure: string[] = [];
    let importantFiles: string[] = [];
    
    try {
      const tree = await githubClient.getRepoTree(owner, repoName, 'HEAD', true);
      
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
      
      console.log(`获取 ${repo.fullName} 文件结构: ${allFiles.length} 个文件，其中 ${importantFiles.length} 个重要文件`);
      
    } catch (error) {
      console.log(`无法获取 ${repo.fullName} 的文件结构:`, error);
    }

    // 在 AI 分析前再次检查是否已停止
    if (analysisStateManager.isStopped()) {
      return;
    }

    // 获取自定义标签
    const customTags = await CustomTagService.findAll();
    const customCategories = customTags.map(tag => tag.content);

    // AI分析（使用数据库中的仓库信息）
    const analysisResult = await analyzer.analyzeRepo({
      name: repo.name,
      fullName: repo.fullName,
      description: repo.description || undefined,
      language: repo.language || undefined,
      stars: repo.stars,
      forks: repo.forks,
      url: repo.url,
      readmeContent,
      fileStructure,
      topics: repo.topics || [],
      customCategories
    });

    if (analysisResult.success && analysisResult.data) {
      // 标签去重和标准化
      const uniqueTags = [...new Set(analysisResult.data.tags)];

      // 将标签保存到 tags 表
      if (uniqueTags.length > 0) {
        await TagService.createMany(uniqueTags);
      }

      // 更新仓库的 AI 分析数据
      await RepoService.update(repo.id, {
        aiDescription: analysisResult.data.summary,
        aiTags: uniqueTags
      });

      // 详细日志记录
      const hasReadme = !!readmeContent;
      const fileCount = fileStructure.length;
      const importantFileCount = importantFiles.length;
      
      console.log(`✅ 成功分析并更新仓库: ${repo.fullName}`);
      console.log(`   - README: ${hasReadme ? '有' : '无'}`);
      console.log(`   - 文件总数: ${fileCount} (重要文件: ${importantFileCount})`);
      console.log(`   - 生成标签: ${uniqueTags.join(', ')}`);
      console.log(`   - AI概述: ${analysisResult.data.summary}`);
      
      analysisStateManager.incrementCompleted();
    } else {
      console.error(`❌ 分析仓库失败: ${repo.fullName}`);
      console.error(`   - 错误信息: ${analysisResult.error}`);
      console.error(`   - README状态: ${readmeContent ? '有' : '无'}`);
      console.error(`   - 文件结构: ${fileStructure.length} 个文件`);
      analysisStateManager.incrementFailed();
    }

  } catch (error) {
    console.error(`处理仓库 ${repo.fullName} 时出错:`, error);
    analysisStateManager.incrementFailed();
  } finally {
    analysisStateManager.removeProcessing(repo.fullName);
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
