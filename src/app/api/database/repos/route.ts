import { NextRequest, NextResponse } from 'next/server';
import { RepoService } from '@/lib/database/repos';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '12');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    const search = searchParams.get('search') || '';

    // 计算偏移量
    const skip = (page - 1) * perPage;

    let repos;
    let totalCount;

    if (search) {
      // 搜索模式
      repos = await RepoService.search(search);
      totalCount = repos.length;
      // 分页
      repos = repos.slice(skip, skip + perPage);
    } else if (tags.length > 0) {
      // 按标签筛选
      repos = await RepoService.findByTags(tags);
      totalCount = repos.length;
      // 分页
      repos = repos.slice(skip, skip + perPage);
    } else {
      // 获取所有仓库
      repos = await RepoService.findAll();
      totalCount = repos.length;
      // 分页
      repos = repos.slice(skip, skip + perPage);
    }

    // 转换为前端需要的格式
    const formattedRepos = repos.map(repo => ({
      id: repo.id, // 保持字符串类型，因为数据库ID是CUID字符串
      name: repo.name,
      full_name: repo.fullName,
      description: repo.aiDescription || repo.description, // 优先使用AI生成的描述，如果没有则使用原始描述
      stargazers_count: repo.stars,
      language: repo.language,
      topics: repo.tags || [],
      html_url: repo.url,
      created_at: repo.createdAt.toISOString(),
      updated_at: repo.updatedAt.toISOString()
    }));

    return NextResponse.json({
      repos: formattedRepos,
      pagination: {
        page,
        per_page: perPage,
        has_next: skip + perPage < totalCount,
        has_prev: page > 1
      },
      total: totalCount
    });

  } catch (error) {
    console.error('获取数据库仓库失败:', error);
    return NextResponse.json(
      { 
        error: '获取仓库数据失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
