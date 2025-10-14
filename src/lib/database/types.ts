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
  tags: string[]
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
  tags?: string[]
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
  tags?: string[]
}
