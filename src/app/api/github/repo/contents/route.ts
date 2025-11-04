import { NextRequest, NextResponse } from 'next/server';
import { GitHubClient } from '@/lib/github';
import { RepoContentOptions } from '@/lib/github/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');
    const path = searchParams.get('path') || '';
    const ref = searchParams.get('ref');
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

    const options: RepoContentOptions = {
      ref: ref || undefined,
      recursive
    };

    const contents = await client.getRepoContents(owner, repo, path, options);

    return NextResponse.json({
      contents,
      path,
      count: contents.length
    });

  } catch (error) {
    console.error('获取 GitHub 仓库内容错误:', error);
    interface ErrorWithCode extends Error {
      code?: string;
      details?: string;
    }
    const err = error as ErrorWithCode;
    const code = err?.code;
    if (code === 'GITHUB_TOKEN_MISSING' || code === 'GITHUB_TOKEN_INVALID') {
      return NextResponse.json(
        {
          error: code === 'GITHUB_TOKEN_MISSING' ? 'GitHub Token 未配置' : 'GitHub Token 无效',
          code,
          details: err?.details || (error instanceof Error ? error.message : undefined)
        },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { 
        error: '获取仓库内容失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
