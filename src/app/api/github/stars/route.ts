import { NextRequest, NextResponse } from 'next/server';
import { GitHubClient } from '@/lib/github';
import { StarListOptions } from '@/lib/github/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const per_page = parseInt(searchParams.get('per_page') || '30');
    const page = parseInt(searchParams.get('page') || '1');
    const sort = (searchParams.get('sort') as 'created' | 'updated') || 'created';
    const direction = (searchParams.get('direction') as 'asc' | 'desc') || 'desc';

    const client = new GitHubClient();

    if (!client.isConfigured()) {
      return NextResponse.json(
        { error: 'GitHub 服务未配置，请检查 API token' },
        { status: 500 }
      );
    }

    const options: StarListOptions = {
      per_page,
      page,
      sort,
      direction
    };

    const stars = await client.getMyStarredRepos(options);

    return NextResponse.json({
      stars,
      pagination: {
        page,
        per_page,
        has_more: stars.length === per_page
      }
    });

  } catch (error) {
    console.error('获取当前用户 GitHub stars 错误:', error);
    
    return NextResponse.json(
      { 
        error: '获取当前用户 star 列表失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { options = {} } = body;

    const client = new GitHubClient();

    if (!client.isConfigured()) {
      return NextResponse.json(
        { error: 'GitHub 服务未配置，请检查 API token' },
        { status: 500 }
      );
    }

    const stars = await client.getMyStarredRepos(options);

    return NextResponse.json({
      stars,
      count: stars.length
    });

  } catch (error) {
    console.error('获取我的 GitHub stars 错误:', error);
    
    return NextResponse.json(
      { 
        error: '获取我的 star 列表失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
