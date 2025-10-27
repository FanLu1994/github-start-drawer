import { NextRequest, NextResponse } from 'next/server';
import { TagService } from '@/lib/database/tags';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const random = searchParams.get('random') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');

    let tags;

    if (search) {
      // 搜索标签
      tags = await TagService.search(search);
    } else if (random) {
      // 随机获取标签
      tags = await TagService.findRandom(limit);
    } else {
      // 获取所有标签
      tags = await TagService.findAll();
    }

    // 转换为前端需要的格式（只返回标签名称数组）
    const tagNames = tags.map(tag => tag.name);

    return NextResponse.json({
      tags: tagNames
    });

  } catch (error) {
    console.error('获取数据库标签失败:', error);
    return NextResponse.json(
      { 
        error: '获取标签数据失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
