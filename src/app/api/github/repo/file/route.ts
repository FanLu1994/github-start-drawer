import { NextRequest, NextResponse } from 'next/server';
import { GitHubClient } from '@/lib/github';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');
    const path = searchParams.get('path');
    const ref = searchParams.get('ref');

    if (!owner || !repo || !path) {
      return NextResponse.json(
        { error: 'owner、repo 和 path 参数是必需的' },
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

    const file = await client.getFileContent(owner, repo, path, ref);

    return NextResponse.json(file);

  } catch (error) {
    console.error('获取 GitHub 文件内容错误:', error);
    
    return NextResponse.json(
      { 
        error: '获取文件内容失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
