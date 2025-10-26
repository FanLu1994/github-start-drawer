# 数据库配置说明

## 环境配置

1. 确保已配置 `POSTGRES_URL` 环境变量
2. 数据库名称：`github-stars`

## 数据库表结构

### repos 表
- `id`: 主键 (String, CUID)
- `name`: 仓库名称 (String)
- `fullName`: 完整仓库名 (String, 唯一)
- `description`: 仓库描述 (String, 可选)
- `stars`: 星标数 (Int, 默认0)
- `forks`: Fork数 (Int, 默认0)
- `language`: 主要编程语言 (String, 可选)
- `url`: 仓库URL (String)
- `aiDescription`: AI生成的描述 (String, 可选)
- `tags`: 标签列表 (String[])
- `isDeleted`: 软删除标记 (Boolean, 默认false)
- `createdAt`: 创建时间 (DateTime)
- `updatedAt`: 更新时间 (DateTime)

### tags 表
- `id`: 主键 (String, CUID)
- `name`: 标签名称 (String, 唯一)

## 可用脚本

```bash
# 生成 Prisma 客户端
pnpm db:generate

# 创建数据库迁移
pnpm db:migrate

# 部署迁移到生产环境
pnpm db:deploy

# 初始化示例数据
pnpm db:seed

# 打开 Prisma Studio (数据库管理界面)
pnpm db:studio
```

## 使用示例

```typescript
import { RepoService, TagService } from '@/lib/database'

// 创建仓库
const repo = await RepoService.create({
  name: 'my-repo',
  fullName: 'user/my-repo',
  description: 'My awesome repository',
  stars: 100,
  url: 'https://github.com/user/my-repo',
  tags: ['JavaScript', 'React']
})

// 获取所有仓库
const repos = await RepoService.findAll()

// 根据标签筛选
const jsRepos = await RepoService.findByTags(['JavaScript'])

// 搜索仓库
const searchResults = await RepoService.search('react')

// 软删除仓库
await RepoService.delete('repo-id')

// 恢复已删除的仓库
await RepoService.restore('repo-id')

// 获取已删除的仓库
const deletedRepos = await RepoService.findDeleted()

// 硬删除仓库（真正从数据库删除）
await RepoService.hardDelete('repo-id')

// 创建标签
const tag = await TagService.create('Vue.js')

// 获取所有标签
const tags = await TagService.findAll()
```

## 软删除功能

该数据库支持软删除功能，通过 `isDeleted` 字段实现：

- **软删除**: 调用 `RepoService.delete()` 会将 `isDeleted` 设置为 `true`，记录不会从数据库中删除
- **恢复**: 调用 `RepoService.restore()` 可以将已删除的记录恢复
- **查询过滤**: 所有查询方法（`findAll`, `findById`, `findByFullName`, `findByTags`, `search`）默认只返回未删除的记录
- **硬删除**: 调用 `RepoService.hardDelete()` 会真正从数据库中删除记录
- **查看已删除**: 使用 `RepoService.findDeleted()` 可以查看所有已删除的记录

## 注意事项

1. 确保 PostgreSQL 服务正在运行
2. 确保 `POSTGRES_URL` 环境变量正确配置
3. 首次运行前需要执行 `pnpm db:migrate` 创建表结构
4. 可以使用 `pnpm db:seed` 初始化示例数据
5. 软删除功能确保数据安全，避免意外丢失重要信息

