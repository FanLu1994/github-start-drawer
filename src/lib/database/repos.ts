import { prisma } from '@/lib/prisma'
import { CreateRepoData, UpdateRepoData } from './types'

export class RepoService {
  // 创建仓库
  static async create(data: CreateRepoData) {
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
        tags: data.tags || []
      }
    })
  }

  // 根据ID获取仓库
  static async findById(id: string) {
    return await prisma.repo.findUnique({
      where: { id }
    })
  }

  // 根据fullName获取仓库
  static async findByFullName(fullName: string) {
    return await prisma.repo.findUnique({
      where: { fullName }
    })
  }

  // 获取所有仓库
  static async findAll() {
    return await prisma.repo.findMany({
      orderBy: { stars: 'desc' }
    })
  }

  // 根据标签筛选仓库
  static async findByTags(tags: string[]) {
    return await prisma.repo.findMany({
      where: {
        tags: {
          hasSome: tags
        }
      },
      orderBy: { stars: 'desc' }
    })
  }

  // 搜索仓库
  static async search(query: string) {
    return await prisma.repo.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { aiDescription: { contains: query, mode: 'insensitive' } }
        ]
      },
      orderBy: { stars: 'desc' }
    })
  }

  // 更新仓库
  static async update(id: string, data: UpdateRepoData) {
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
        ...(data.tags && { tags: data.tags })
      }
    })
  }

  // 删除仓库
  static async delete(id: string) {
    return await prisma.repo.delete({
      where: { id }
    })
  }

  // 批量创建仓库
  static async createMany(repos: CreateRepoData[]) {
    return await prisma.repo.createMany({
      data: repos.map(repo => ({
        name: repo.name,
        fullName: repo.fullName,
        description: repo.description,
        stars: repo.stars || 0,
        forks: repo.forks || 0,
        language: repo.language,
        url: repo.url,
        aiDescription: repo.aiDescription,
        tags: repo.tags || []
      })),
      skipDuplicates: true
    })
  }
}
