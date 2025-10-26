import { NextRequest, NextResponse } from 'next/server';
import { GitHubClient } from '@/lib/github/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '12');
    const sort = searchParams.get('sort') || 'created';
    const direction = searchParams.get('direction') || 'desc';

    const githubClient = new GitHubClient();
    
    if (!githubClient.isConfigured()) {
      return NextResponse.json(
        { error: 'GitHub 未配置' },
        { status: 400 }
      );
    }

    // 获取当前用户的starred repos
    const starredRepos = await githubClient.getMyStarredRepos({
      page,
      per_page: perPage,
      sort: sort as 'created' | 'updated',
      direction: direction as 'asc' | 'desc'
    });

    // 获取总数（通过第一页计算）
    let totalCount = 0;
    if (page === 1) {
      const firstPageRepos = await githubClient.getMyStarredRepos({
        page: 1,
        per_page: 1,
        sort: sort as 'created' | 'updated',
        direction: direction as 'asc' | 'desc'
      });
      // GitHub API不直接提供总数，我们需要通过其他方式获取
      // 这里先返回当前页的数据，总数可以通过其他API获取
    }

    return NextResponse.json({
      repos: starredRepos,
      pagination: {
        page,
        per_page: perPage,
        has_next: starredRepos.length === perPage,
        has_prev: page > 1
      },
      total: starredRepos.length
    });

  } catch (error) {
    console.error('获取GitHub仓库失败:', error);
    return NextResponse.json(
      { 
        error: '获取仓库数据失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
