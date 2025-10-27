#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanRemoteDatabase() {
  try {
    console.log('开始清理远端数据库...')
    
    // 清理 repos 表
    console.log('清理 repos 表...')
    const deletedRepos = await prisma.repo.deleteMany({})
    console.log(`已删除 ${deletedRepos.count} 条 repos 记录`)
    
    // 清理 tags 表
    console.log('清理 tags 表...')
    const deletedTags = await prisma.tag.deleteMany({})
    console.log(`已删除 ${deletedTags.count} 条 tags 记录`)
    
    console.log('远端数据库清理完成！')
    
  } catch (error) {
    console.error('清理数据库时发生错误:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// 确认操作
async function confirmCleanup() {
  console.log('⚠️  警告：此操作将清空远端数据库中的所有数据！')
  console.log('这将删除所有 repos 和 tags 记录，且无法恢复。')
  console.log('')
  
  // 检查是否有数据
  const repoCount = await prisma.repo.count()
  const tagCount = await prisma.tag.count()
  
  console.log(`当前数据库状态：`)
  console.log(`- repos 记录数: ${repoCount}`)
  console.log(`- tags 记录数: ${tagCount}`)
  console.log('')
  
  if (repoCount === 0 && tagCount === 0) {
    console.log('数据库已经是空的，无需清理。')
    await prisma.$disconnect()
    return
  }
  
  // 在 Node.js 环境中，我们需要使用 readline 来获取用户输入
  const readline = require('readline')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  return new Promise<void>((resolve) => {
    rl.question('确认要清理远端数据库吗？请输入 "yes" 确认: ', async (answer: string) => {
      rl.close()
      
      if (answer.toLowerCase() === 'yes') {
        await cleanRemoteDatabase()
      } else {
        console.log('操作已取消。')
      }
      
      resolve()
    })
  })
}

// 主函数
async function main() {
  try {
    await confirmCleanup()
  } catch (error) {
    console.error('脚本执行失败:', error)
    process.exit(1)
  }
}

// 运行脚本
if (require.main === module) {
  main()
}
