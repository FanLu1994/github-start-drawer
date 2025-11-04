import { prisma } from '@/lib/prisma'

export class TagService {
  // 创建标签
  static async create(name: string) {
    return await prisma.tag.create({
      data: { name }
    })
  }

  // 根据ID获取标签
  static async findById(id: string) {
    return await prisma.tag.findUnique({
      where: { id }
    })
  }

  // 根据名称获取标签
  static async findByName(name: string) {
    return await prisma.tag.findUnique({
      where: { name }
    })
  }

  // 获取所有标签
  static async findAll() {
    return await prisma.tag.findMany({
      orderBy: { name: 'asc' }
    })
  }

  // 搜索标签
  static async search(query: string) {
    return await prisma.tag.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive'
        }
      },
      orderBy: { name: 'asc' }
    })
  }

  // 创建或获取标签（如果不存在则创建）
  static async findOrCreate(name: string) {
    const existingTag = await prisma.tag.findUnique({
      where: { name }
    })

    if (existingTag) {
      return existingTag
    }

    return await prisma.tag.create({
      data: { name }
    })
  }

  // 批量创建标签
  static async createMany(names: string[]) {
    return await prisma.tag.createMany({
      data: names.map(name => ({ name })),
      skipDuplicates: true
    })
  }

  // 删除标签
  static async delete(id: string) {
    return await prisma.tag.delete({
      where: { id }
    })
  }

  // 随机获取标签
  static async findRandom(limit: number = 20) {
    // 使用原生SQL实现真正的随机排序
    interface TagRow {
      id: string;
      name: string;
    }
    return await prisma.$queryRaw<TagRow[]>`
      SELECT * FROM tags 
      ORDER BY RANDOM() 
      LIMIT ${limit}
    `;
  }

  // 根据名称删除标签
  static async deleteByName(name: string) {
    return await prisma.tag.delete({
      where: { name }
    })
  }
}
