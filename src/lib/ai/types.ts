/**
 * AI 工具模块类型定义
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
  timestamp: Date;
  finishReason?: string;
}

export interface StreamResponse {
  content: string;
  isComplete: boolean;
  timestamp: Date;
}

export interface AIError {
  message: string;
  code?: string;
  details?: unknown;
  timestamp: Date;
}

export type AIProvider = 'deepseek' | 'openai' | 'anthropic';

export interface AIRequestOptions {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  systemPrompt?: string;
}

// Repo AI 分析相关类型
export interface RepoAnalysisRequest {
  name: string;
  fullName: string;
  description?: string;
  language?: string;
  stars?: number;
  forks?: number;
  url: string;
  readmeContent?: string;
  fileStructure?: string[];
  topics?: string[];
  customCategories?: string[];
}

export interface RepoAnalysisResult {
  summary: string;
  tags: string[];
}

export interface RepoAnalysisResponse {
  success: boolean;
  data?: RepoAnalysisResult;
  error?: string;
  timestamp: Date;
}