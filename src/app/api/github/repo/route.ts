import { NextRequest, NextResponse } from 'next/server';
import { GitHubClient } from '@/lib/github';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');

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

    const repoInfo = await client.getRepo(owner, repo);

    return NextResponse.json(repoInfo);

  } catch (error) {
    console.error('获取 GitHub 仓库信息错误:', error);
    const code = (error as any)?.code;
    if (code === 'GITHUB_TOKEN_MISSING' || code === 'GITHUB_TOKEN_INVALID') {
      return NextResponse.json(
        {
          error: code === 'GITHUB_TOKEN_MISSING' ? 'GitHub Token 未配置' : 'GitHub Token 无效',
          code,
          details: (error as any)?.details || (error instanceof Error ? error.message : undefined)
        },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { 
        error: '获取仓库信息失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
