import { DeepSeekClient } from './deepseek-client'

export interface SearchQueryAnalysis {
  intent: string
  keywords: string[]
  secondaryKeywords: string[]
  technicalKeywords: string[]
  categories: string[]
  platforms: string[]
  synonyms: string[]
}

interface CombinedAnalysisResponse {
  intent?: string
  keywords?: {
    primary?: string[]
    secondary?: string[]
    technical?: string[]
    synonyms?: string[]
    categories?: string[]
    platforms?: string[]
    translations?: {
      zh?: string[]
      en?: string[]
    }
  }
}

const SYSTEM_PROMPT = `你是一个专业的搜索查询分析助手。无论用户输入什么内容，都必须严格返回有效的 JSON 数据，不能包含除 JSON 之外的任何文本。`

const normalizeArray = (value: unknown): string[] => {
  if (!value) return []
  if (Array.isArray(value)) {
    return value
      .map(item => (typeof item === 'string' ? item.trim() : ''))
      .filter(item => item.length > 0)
  }
  if (typeof value === 'string') {
    return value
      .split(/[\s,/]+/)
      .map(item => item.trim())
      .filter(item => item.length > 0)
  }
  return []
}

const extractJson = (text: string): string | null => {
  if (!text) return null

  let normalized = text.trim()

  if (normalized.startsWith('```')) {
    normalized = normalized.replace(/^```[a-zA-Z]*\n?/i, '')
    normalized = normalized.replace(/```$/i, '').trim()
  }

  try {
    JSON.parse(normalized)
    return normalized
  } catch {
    const match = normalized.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        JSON.parse(match[0])
        return match[0]
      } catch (innerError) {
        console.error('解析 AI 响应失败:', innerError)
      }
    }
    return null
  }
}

const safeJsonParse = <T>(text: string): T | null => {
  const jsonText = extractJson(text)
  if (!jsonText) {
    return null
  }

  try {
    return JSON.parse(jsonText) as T
  } catch (error) {
    console.error('解析 AI 响应失败:', error)
    return null
  }
}

export class SearchQueryAnalyzer {
  private client: DeepSeekClient | null = null
  private readonly cache = new Map<string, SearchQueryAnalysis>()
  private readonly CACHE_LIMIT = 50

  constructor() {
    try {
      this.client = new DeepSeekClient()
    } catch (error) {
      console.error('初始化搜索分析客户端失败:', error)
      this.client = null
    }
  }

  isAvailable(): boolean {
    return !!this.client && this.client.isConfigured()
  }

  private buildPrompt(query: string): string {
    return `用户搜索查询: "${query}"

请深度分析这个搜索查询并严格按照以下 JSON 结构回复（不能包含任何额外文本）：
{
  "intent": "",
  "keywords": {
    "primary": [""],
    "secondary": [""],
    "technical": [""],
    "synonyms": [""],
    "categories": [""],
    "platforms": [""],
    "translations": {
      "zh": [""],
      "en": [""]
    }
  }
}

要求：
- keywords.primary: 核心关键词（包含中英文）
- keywords.secondary: 次要关键词或相关短语
- keywords.technical: 相关技术术语
- keywords.synonyms: 同义词或近义词
- keywords.categories: 关联的应用类型、行业或领域
- keywords.platforms: 相关平台或环境（如 web, cli, ios, android, docker 等）
- keywords.translations.zh: 中文关键词列表
- keywords.translations.en: 英文关键词列表
- intent: 用简短中文描述用户的核心搜索意图

必须确保返回的 JSON 可直接被 JSON.parse 解析。`
  }

  private updateCache(key: string, value: SearchQueryAnalysis) {
    this.cache.set(key, value)
    if (this.cache.size > this.CACHE_LIMIT) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }
  }

  async analyzeQuery(query: string): Promise<SearchQueryAnalysis | null> {
    if (!this.isAvailable()) {
      return null
    }

    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) {
      return null
    }

    const cached = this.cache.get(normalizedQuery)
    if (cached) {
      return cached
    }

    try {
      const responseText = await this.client!.sendMessage(
        this.buildPrompt(query),
        SYSTEM_PROMPT
      )

      const parsed = safeJsonParse<CombinedAnalysisResponse>(responseText)

      if (!parsed || !parsed.keywords) {
        return null
      }

      const primaryKeywords = normalizeArray(parsed.keywords.primary)
      const secondaryKeywords = normalizeArray(parsed.keywords.secondary)
      const technicalKeywords = normalizeArray(parsed.keywords.technical)
      const synonymKeywords = normalizeArray(parsed.keywords.synonyms)
      const categoryKeywords = normalizeArray(parsed.keywords.categories)
      const platformKeywords = normalizeArray(parsed.keywords.platforms)
      const translationZh = normalizeArray(parsed.keywords.translations?.zh)
      const translationEn = normalizeArray(parsed.keywords.translations?.en)

      const combinedKeywords = new Set<string>(
        [
          ...primaryKeywords,
          ...translationZh,
          ...translationEn
        ].map(term => term.toLowerCase())
      )

      const result: SearchQueryAnalysis = {
        intent: parsed.intent || '',
        keywords: Array.from(combinedKeywords),
        secondaryKeywords,
        technicalKeywords,
        categories: categoryKeywords,
        platforms: platformKeywords,
        synonyms: synonymKeywords
      }

      this.updateCache(normalizedQuery, result)

      return result
    } catch (error) {
      console.error('搜索查询分析失败:', error)
      return null
    }
  }
}

