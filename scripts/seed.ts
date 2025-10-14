import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 创建示例标签
  const tags = [
    'JavaScript',
    'TypeScript', 
    'React',
    'Vue',
    'Node.js',
    'Python',
    'Java',
    'Go',
    'Rust',
    'C++',
    'Machine Learning',
    'Web Development',
    'Mobile',
    'DevOps',
    'Database'
  ]

  console.log('创建标签...')
  for (const tagName of tags) {
    await prisma.tag.upsert({
      where: { name: tagName },
      update: {},
      create: { name: tagName }
    })
  }

  // 创建示例仓库
  const repos = [
    {
      name: 'awesome-javascript',
      fullName: 'sindresorhus/awesome-javascript',
      description: 'A collection of awesome JavaScript libraries and resources',
      stars: 15000,
      forks: 2000,
      language: 'JavaScript',
      url: 'https://github.com/sindresorhus/awesome-javascript',
      aiDescription: '这是一个收集了各种优秀JavaScript库和资源的精选列表，涵盖了前端开发、后端开发、工具库等多个领域，是JavaScript开发者必收藏的资源库。',
      tags: ['JavaScript', 'Web Development']
    },
    {
      name: 'react-native',
      fullName: 'facebook/react-native',
      description: 'A framework for building native apps with React',
      stars: 12000,
      forks: 3000,
      language: 'JavaScript',
      url: 'https://github.com/facebook/react-native',
      aiDescription: 'Facebook开发的跨平台移动应用开发框架，允许开发者使用React和JavaScript构建原生iOS和Android应用，具有热重载、组件化开发等特性。',
      tags: ['React', 'Mobile', 'JavaScript']
    },
    {
      name: 'tensorflow',
      fullName: 'tensorflow/tensorflow',
      description: 'An open source machine learning framework',
      stars: 180000,
      forks: 88000,
      language: 'Python',
      url: 'https://github.com/tensorflow/tensorflow',
      aiDescription: 'Google开源的机器学习框架，支持深度学习、神经网络训练和推理，广泛应用于计算机视觉、自然语言处理、推荐系统等领域。',
      tags: ['Python', 'Machine Learning']
    }
  ]

  console.log('创建仓库...')
  for (const repo of repos) {
    await prisma.repo.upsert({
      where: { fullName: repo.fullName },
      update: {},
      create: {
        name: repo.name,
        fullName: repo.fullName,
        description: repo.description,
        stars: repo.stars,
        forks: repo.forks,
        language: repo.language,
        url: repo.url,
        aiDescription: repo.aiDescription,
        tags: repo.tags
      }
    })
  }

  console.log('数据库初始化完成！')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
