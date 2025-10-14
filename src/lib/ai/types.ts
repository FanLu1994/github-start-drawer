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
  details?: any;
  timestamp: Date;
}

export type AIProvider = 'deepseek' | 'openai' | 'anthropic';

export interface AIRequestOptions {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  systemPrompt?: string;
}
