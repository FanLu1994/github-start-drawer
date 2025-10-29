export interface Repo {
  id: string
  name: string
  fullName: string
  description: string | null
  stars: number
  forks: number
  language: string | null
  url: string
  createdAt: Date
  updatedAt: Date
  aiDescription: string | null
  topics: string[]
  aiTags: Tag[]
  isDeleted: boolean
}

export interface Tag {
  id: string
  name: string
}

export interface CreateRepoData {
  name: string
  fullName: string
  description?: string
  stars?: number
  forks?: number
  language?: string
  url: string
  aiDescription?: string
  topics?: string[]
  aiTags?: string[] // 标签名称数组，用于创建关联
  isDeleted?: boolean
}

export interface UpdateRepoData {
  name?: string
  fullName?: string
  description?: string
  stars?: number
  forks?: number
  language?: string
  url?: string
  aiDescription?: string
  topics?: string[]
  aiTags?: string[] // 标签名称数组，用于更新关联
  isDeleted?: boolean
}
