import { NextRequest, NextResponse } from 'next/server';
import { GitHubClient } from '@/lib/github';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { owner, repo } = body;

    if (!owner || !repo) {
      return NextResponse.json(
        { error: '需要提供 owner 和 repo 参数' },
        { status: 400 }
      );
    }

    const githubClient = new GitHubClient();
    
    if (!githubClient.isConfigured()) {
      return NextResponse.json(
        { error: 'GitHub 服务未配置' },
        { status: 400 }
      );
    }

    // 调用 GitHub API 取消星标
    const response = await fetch(`https://api.github.com/user/starred/${owner}/${repo}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitHub-Star-Drawer'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: '仓库未星标或不存在' },
          { status: 404 }
        );
      }
      
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          error: '取消星标失败',
          details: errorData.message || `HTTP ${response.status}`
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      message: '已取消星标',
      repo: `${owner}/${repo}`
    });

  } catch (error) {
    console.error('取消星标失败:', error);
    return NextResponse.json(
      { 
        error: '取消星标失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
