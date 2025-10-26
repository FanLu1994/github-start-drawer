/**
 * AI 工具模块入口文件
 */
export { DeepSeekClient } from './deepseek-client';
export { ConfigManager, type AIConfig, type DeepSeekConfig, DEFAULT_DEEPSEEK_CONFIG } from './config';
export { RepoAnalyzer } from './repo-analyzer';

// 导出类型
export type {
  ChatMessage,
  AIResponse,
  StreamResponse,
  AIError,
  AIRequestOptions,
  RepoAnalysisRequest,
  RepoAnalysisResult,
  RepoAnalysisResponse
} from './types';

// 默认导出
export { DeepSeekClient as default } from './deepseek-client';
