import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 获取仓库总数（未删除的）
    const totalRepos = await prisma.repo.count({
      where: { isDeleted: false }
    });

    // 获取已分析的仓库数（有 aiDescription 的）
    const analyzedRepos = await prisma.repo.count({
      where: {
        isDeleted: false,
        aiDescription: {
          not: null
        }
      }
    });

    return NextResponse.json({
      totalRepos,
      analyzedRepos,
      unanalyzedRepos: totalRepos - analyzedRepos
    });
  } catch (error) {
    console.error('获取统计信息失败:', error);
    return NextResponse.json(
      { error: '获取统计信息失败' },
      { status: 500 }
    );
  }
}

