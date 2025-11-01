import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // 获取所有自定义标签及其关联的仓库数量
    const customTags = await prisma.customTag.findMany({
      orderBy: { content: 'asc' }
    })

    // 为每个自定义标签计算关联的仓库数量
    const tagsWithCount = await Promise.all(
      customTags.map(async (tag) => {
        // 查找 Tag 表中 name 等于自定义标签 content 的标签
        const matchingTag = await prisma.tag.findUnique({
          where: { name: tag.content }
        })

        let count = 0
        if (matchingTag) {
          // 统计关联了该标签的仓库数量
          count = await prisma.repo.count({
            where: {
              isDeleted: false,
              repoAiTags: {
                some: {
                  tagId: matchingTag.id
                }
              }
            }
          })
        }

        return {
          id: tag.id,
          content: tag.content,
          count
        }
      })
    )

    // 返回所有标签，按数量降序排序，数量相同的按名称排序
    const sortedTags = tagsWithCount.sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count
      }
      return a.content.localeCompare(b.content, 'zh-CN')
    })

    return NextResponse.json({ tags: sortedTags })
  } catch (error) {
    console.error('获取自定义标签统计失败:', error)
    return NextResponse.json({ error: '获取标签统计失败' }, { status: 500 })
  }
}

