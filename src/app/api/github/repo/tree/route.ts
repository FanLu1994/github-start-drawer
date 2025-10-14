import { NextRequest, NextResponse } from 'next/server';
import { GitHubClient } from '@/lib/github';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');
    const sha = searchParams.get('sha') || 'HEAD';
    const recursive = searchParams.get('recursive') === 'true';

    if (!owner || !repo) {
      return NextResponse.json(
        { error: 'owner 和 repo 参数是必需的' },
        { status: 400 }
      );
    }

    const client = new GitHubClient();

    if (!client.isConfigured()) {
      return NextResponse.json(
        { error: 'GitHub 服务未配置，请检查 API token' },
        { status: 500 }
      );
    }

    const tree = await client.getRepoTree(owner, repo, sha, recursive);

    return NextResponse.json({
      tree,
      sha,
      count: tree.length
    });

  } catch (error) {
    console.error('获取 GitHub 仓库树错误:', error);
    
    return NextResponse.json(
      { 
        error: '获取仓库树失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
