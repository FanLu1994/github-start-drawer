import { NextRequest, NextResponse } from 'next/server';
import { GitHubClient } from '@/lib/github';
import { RepoService } from '@/lib/database/repos';
import { syncStateManager } from '@/lib/sync-state';

export async function POST(request: NextRequest) {
  try {
    const state = syncStateManager.getState();
    
    // 如果已经在运行，返回当前状态
    if (state.isRunning) {
      return NextResponse.json({
        message: '同步已在进行中',
        progress: state.progress
      });
    }

    const githubClient = new GitHubClient();
    
    if (!githubClient.isConfigured()) {
      return NextResponse.json(
        { error: 'GitHub 服务未配置' },
        { status: 400 }
      );
    }

    // 启动同步（异步执行）
    startSyncProcess();

    return NextResponse.json({
      message: '同步已启动',
      progress: syncStateManager.getState().progress
    });

  } catch (error) {
    console.error('启动同步失败:', error);
    return NextResponse.json(
      { 
        error: '启动同步失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

async function startSyncProcess() {
  syncStateManager.setRunning(true);
  syncStateManager.setError(null);
  
  try {
    const githubClient = new GitHubClient();
    
    // 获取所有星标仓库
    syncStateManager.setProgress({ status: '正在获取GitHub星标仓库...' });
    const starredRepos = await githubClient.getAllStarredRepos();
    
    syncStateManager.setProgress({
      total: starredRepos.length,
      current: 0,
      synced: 0,
      skipped: 0,
      errors: 0,
      status: '正在同步仓库...'
    });

    // 批量同步仓库
    for (const repo of starredRepos) {
      try {
        // 检查仓库是否已存在（包括已删除的）
        const existingRepo = await RepoService.findByFullName(repo.full_name);
        
        if (existingRepo) {
          // 如果仓库存在但已删除，恢复它
          if (existingRepo.isDeleted) {
            await RepoService.update(existingRepo.id, {
              isDeleted: false,
              stars: repo.stargazers_count,
              forks: repo.forks_count,
              language: repo.language || undefined,
              description: repo.description || '',
              topics: repo.topics || []
            });
            syncStateManager.incrementSynced();
            syncStateManager.setProgress({
              status: `恢复已删除的仓库: ${repo.full_name} (${syncStateManager.getState().progress.current}/${syncStateManager.getState().progress.total})`
            });
          } else {
            // 仓库已存在且未删除，跳过
            syncStateManager.incrementSkipped();
            syncStateManager.setProgress({
              status: `跳过已存在的仓库: ${repo.full_name} (${syncStateManager.getState().progress.current}/${syncStateManager.getState().progress.total})`
            });
          }
          continue;
        }

        // 保存仓库基本信息（不进行 AI 分析）
        syncStateManager.setProgress({
          status: `正在同步: ${repo.full_name} (${syncStateManager.getState().progress.current}/${syncStateManager.getState().progress.total})`
        });

        await RepoService.create({
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description || '',
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          language: repo.language || undefined,
          url: repo.html_url,
          topics: repo.topics || [],
          isDeleted: false
        });

        syncStateManager.incrementSynced();
      } catch (error) {
        // 处理唯一约束错误
        if (error instanceof Error && error.message.includes('Unique constraint')) {
          // 如果是因为唯一约束冲突，说明仓库已存在，跳过
          syncStateManager.incrementSkipped();
          syncStateManager.setProgress({
            status: `跳过已存在的仓库: ${repo.full_name} (${syncStateManager.getState().progress.current}/${syncStateManager.getState().progress.total})`
          });
        } else {
          const errorMsg = `同步 ${repo.full_name} 失败: ${error instanceof Error ? error.message : '未知错误'}`;
          console.error(errorMsg);
          syncStateManager.incrementError();
          syncStateManager.setProgress({
            status: `同步出错: ${repo.full_name} (${syncStateManager.getState().progress.current}/${syncStateManager.getState().progress.total})`
          });
        }
      }
    }

    const finalState = syncStateManager.getState().progress;
    syncStateManager.setProgress({ status: 'completed' });
    console.log(`同步完成: 总计 ${finalState.total}，已同步 ${finalState.synced}，跳过 ${finalState.skipped}，错误 ${finalState.errors}`);

  } catch (error) {
    console.error('同步过程出错:', error);
    syncStateManager.setError(error instanceof Error ? error.message : '同步失败');
    syncStateManager.setProgress({ status: 'error' });
  } finally {
    syncStateManager.setRunning(false);
  }
}

// 获取同步进度
export async function GET() {
  const state = syncStateManager.getState();
  return NextResponse.json({
    isRunning: state.isRunning,
    progress: state.progress,
    error: state.error
  });
}

