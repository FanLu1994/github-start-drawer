import { prisma } from '@/lib/prisma'

export class CustomTagService {
  static async findAll() {
    return prisma.customTag.findMany({
      orderBy: { content: 'asc' }
    })
  }

  static async create(content: string) {
    return prisma.customTag.create({
      data: { content }
    })
  }

  static async update(id: string, content: string) {
    return prisma.customTag.update({
      where: { id },
      data: { content }
    })
  }

  static async delete(id: string) {
    return prisma.customTag.delete({
      where: { id }
    })
  }

  static async findByContent(content: string) {
    return prisma.customTag.findUnique({
      where: { content }
    })
  }
}

