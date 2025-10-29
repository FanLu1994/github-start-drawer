import { prisma } from '@/lib/prisma'
import { CreateRepoData, UpdateRepoData } from './types'
import { TagService } from './tags'

export class RepoService {
  // 创建仓库
  static async create(data: CreateRepoData) {
    // 处理 AI 标签关联
    const repoAiTagsData = data.aiTags && data.aiTags.length > 0
      ? await Promise.all(
          data.aiTags.map(async (tagName) => {
            const tag = await TagService.findOrCreate(tagName)
            return {
              tag: {
                connect: { id: tag.id }
              }
            }
          })
        )
      : []

    return await prisma.repo.create({
      data: {
        name: data.name,
        fullName: data.fullName,
        description: data.description,
        stars: data.stars || 0,
        forks: data.forks || 0,
        language: data.language,
        url: data.url,
        aiDescription: data.aiDescription,
        topics: Array.isArray(data.topics) ? data.topics : [],
        repoAiTags: {
          create: repoAiTagsData
        },
        isDeleted: data.isDeleted || false
      },
      include: {
        repoAiTags: {
          include: {
            tag: true
          }
        }
      }
    })
  }

  // 根据ID获取仓库
  static async findById(id: string) {
    return await prisma.repo.findUnique({
      where: { 
        id,
        isDeleted: false
      },
      include: {
        repoAiTags: {
          include: {
            tag: true
          }
        }
      }
    })
  }

  // 根据fullName获取仓库（包括已删除的）
  static async findByFullName(fullName: string) {
    return await prisma.repo.findUnique({
      where: { 
        fullName
      },
      include: {
        repoAiTags: {
          include: {
            tag: true
          }
        }
      }
    })
  }

  // 根据fullName获取未删除的仓库
  static async findByFullNameActive(fullName: string) {
    const repo = await prisma.repo.findUnique({
      where: { 
        fullName
      }
    })
    
    if (!repo || repo.isDeleted) {
      return null
    }
    
    return await prisma.repo.findUnique({
      where: { 
        fullName
      },
      include: {
        repoAiTags: {
          include: {
            tag: true
          }
        }
      }
    })
  }

  // 获取所有仓库
  static async findAll() {
    return await prisma.repo.findMany({
      where: { isDeleted: false },
      orderBy: { stars: 'desc' },
      include: {
        repoAiTags: {
          include: {
            tag: true
          }
        }
      }
    })
  }

  // 根据标签筛选仓库（支持 topics 和 aiTags）
  static async findByTags(tags: string[]) {
    // 先查找标签ID
    const tagRecords = await prisma.tag.findMany({
      where: {
        name: { in: tags }
      }
    })
    const tagIds = tagRecords.map(t => t.id)

    return await prisma.repo.findMany({
      where: {
        isDeleted: false,
        OR: [
          {
            topics: {
              hasSome: tags
            }
          },
          {
            repoAiTags: {
              some: {
                tagId: { in: tagIds }
              }
            }
          }
        ]
      },
      orderBy: { stars: 'desc' },
      include: {
        repoAiTags: {
          include: {
            tag: true
          }
        }
      }
    })
  }

  // 搜索仓库
  static async search(query: string) {
    return await prisma.repo.findMany({
      where: {
        isDeleted: false,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { aiDescription: { contains: query, mode: 'insensitive' } }
        ]
      },
      orderBy: { stars: 'desc' },
      include: {
        repoAiTags: {
          include: {
            tag: true
          }
        }
      }
    })
  }

  // 更新仓库
  static async update(id: string, data: UpdateRepoData) {
    // 处理 AI 标签关联更新
    if (data.aiTags !== undefined) {
      // 先删除所有现有关联
      await prisma.repoAiTag.deleteMany({
        where: { repoId: id }
      })

      // 创建新的关联
      if (data.aiTags.length > 0) {
        const tagIds = await Promise.all(
          data.aiTags.map(async (tagName) => {
            const tag = await TagService.findOrCreate(tagName)
            return tag.id
          })
        )

        await prisma.repoAiTag.createMany({
          data: tagIds.map(tagId => ({
            repoId: id,
            tagId: tagId
          })),
          skipDuplicates: true
        })
      }
    }

    return await prisma.repo.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.fullName && { fullName: data.fullName }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.stars !== undefined && { stars: data.stars }),
        ...(data.forks !== undefined && { forks: data.forks }),
        ...(data.language !== undefined && { language: data.language }),
        ...(data.url && { url: data.url }),
        ...(data.aiDescription !== undefined && { aiDescription: data.aiDescription }),
        ...(data.topics !== undefined && { topics: data.topics }),
        ...(data.isDeleted !== undefined && { isDeleted: data.isDeleted })
      },
      include: {
        repoAiTags: {
          include: {
            tag: true
          }
        }
      }
    })
  }

  // 软删除仓库
  static async delete(id: string) {
    return await prisma.repo.update({
      where: { id },
      data: { isDeleted: true }
    })
  }

  // 硬删除仓库（真正从数据库删除）
  static async hardDelete(id: string) {
    return await prisma.repo.delete({
      where: { id }
    })
  }

  // 恢复已删除的仓库
  static async restore(id: string) {
    return await prisma.repo.update({
      where: { id },
      data: { isDeleted: false }
    })
  }

  // 获取已删除的仓库
  static async findDeleted() {
    return await prisma.repo.findMany({
      where: { isDeleted: true },
      orderBy: { updatedAt: 'desc' }
    })
  }

  // 批量创建仓库（注意：createMany 不支持嵌套创建，需要单独处理关联）
  static async createMany(repos: CreateRepoData[]) {
    // 先创建仓库
    const createdRepos = await Promise.all(
      repos.map(async (repo) => {
        return await this.create(repo)
      })
    )
    return createdRepos
  }
}
