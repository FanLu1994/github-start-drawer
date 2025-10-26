import { NextResponse } from 'next/server';
import { GitHubClient } from '@/lib/github';
import { RepoService } from '@/lib/database/repos';
import { TagService } from '@/lib/database/tags';
import { RepoAnalyzer } from '@/lib/ai';
import { analysisStateManager } from '@/lib/analysis-state';

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
    status: '正在获取GitHub仓库...'
  });

  try {
    const githubClient = new GitHubClient();
    const analyzer = new RepoAnalyzer();

    // 获取所有星标仓库
    analysisStateManager.setProgress({ status: '正在获取GitHub星标仓库...' });
    const starredRepos = await githubClient.getAllStarredRepos();
    
    analysisStateManager.setProgress({ 
      total: starredRepos.length,
      current: 0
    });

    // 逐个分析仓库
    for (let i = 0; i < starredRepos.length; i++) {
      const repo = starredRepos[i];
      analysisStateManager.setProgress({ 
        current: i + 1,
        status: `正在分析仓库: ${repo.full_name}`
      });

      try {
        // 检查仓库是否已存在
        const existingRepo = await RepoService.findByFullName(repo.full_name);
        if (existingRepo) {
          console.log(`仓库 ${repo.full_name} 已存在，跳过`);
          continue;
        }

        // 获取仓库详细信息（用于验证仓库存在性）
        await githubClient.getRepo(repo.owner.login, repo.name);
        
        // 获取README内容
        let readmeContent = '';
        try {
          const readme = await githubClient.getRepoContents(repo.owner.login, repo.name, 'README.md');
          if (readme && typeof readme === 'string') {
            readmeContent = readme;
          }
        } catch (error) {
          console.log(`无法获取 ${repo.full_name} 的README:`, error);
        }

        // 获取文件结构
        let fileStructure: string[] = [];
        try {
          const tree = await githubClient.getRepoTree(repo.owner.login, repo.name, 'HEAD', true);
          fileStructure = tree.slice(0, 50).map(item => item.path); // 限制文件数量
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
          // 合并所有标签分类到一个数组中
          const allTags = [
            ...(analysisResult.data.tags.languages || []),
            ...(analysisResult.data.tags.frameworks || []),
            ...(analysisResult.data.tags.features || []),
            ...(analysisResult.data.tags.technologies || []),
            ...(analysisResult.data.tags.tools || []),
            ...(analysisResult.data.tags.domains || []),
            ...(analysisResult.data.tags.categories || [])
          ];

          // 去重标签
          const uniqueTags = [...new Set(allTags)];

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

          console.log(`成功分析并保存仓库: ${repo.full_name}，标签: ${uniqueTags.join(', ')}`);
        } else {
          console.error(`分析仓库失败: ${repo.full_name}`, analysisResult.error);
        }

      } catch (error) {
        console.error(`处理仓库 ${repo.full_name} 时出错:`, error);
        // 继续处理下一个仓库
      }
    }

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

// 获取分析进度
export async function GET() {
  const state = analysisStateManager.getState();
  return NextResponse.json({
    isRunning: state.isRunning,
    progress: state.progress,
    error: state.error
  });
}
