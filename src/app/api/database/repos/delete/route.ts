import { NextRequest, NextResponse } from 'next/server';
import { RepoService } from '@/lib/database/repos';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const fullName = searchParams.get('fullName');

    if (!id && !fullName) {
      return NextResponse.json(
        { error: '需要提供 id 或 fullName 参数' },
        { status: 400 }
      );
    }

    let repo;
    if (id) {
      repo = await RepoService.findById(id);
    } else {
      repo = await RepoService.findByFullName(fullName!);
    }

    if (!repo) {
      return NextResponse.json(
        { error: '仓库不存在' },
        { status: 404 }
      );
    }

    // 软删除仓库
    await RepoService.delete(repo.id);

    return NextResponse.json({
      message: '仓库已删除',
      repo: {
        id: repo.id,
        name: repo.name,
        fullName: repo.fullName
      }
    });

  } catch (error) {
    console.error('删除仓库失败:', error);
    return NextResponse.json(
      { 
        error: '删除仓库失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
