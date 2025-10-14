/**
 * AI 配置管理
 */
export interface AIConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface DeepSeekConfig extends AIConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  streaming?: boolean;
  timeout?: number;
}

export const DEFAULT_DEEPSEEK_CONFIG: Partial<DeepSeekConfig> = {
  model: 'deepseek-chat',
  temperature: 0.7,
  maxTokens: 2048,
  baseURL: 'https://api.deepseek.com/v1',
  streaming: true,
  timeout: 30000
};

export class ConfigManager {
  private static instance: ConfigManager;

  private constructor() {}

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  getConfig(): DeepSeekConfig | null {
    const apiKey = this.getApiKey();
    if (!apiKey) return null;
    
    return {
      apiKey,
      model: process.env.DEEPSEEK_MODEL || DEFAULT_DEEPSEEK_CONFIG.model || 'deepseek-chat',
      temperature: process.env.DEEPSEEK_TEMPERATURE ? parseFloat(process.env.DEEPSEEK_TEMPERATURE) : DEFAULT_DEEPSEEK_CONFIG.temperature || 0.7,
      maxTokens: process.env.DEEPSEEK_MAX_TOKENS ? parseInt(process.env.DEEPSEEK_MAX_TOKENS) : DEFAULT_DEEPSEEK_CONFIG.maxTokens || 2048,
      baseURL: process.env.DEEPSEEK_BASE_URL || DEFAULT_DEEPSEEK_CONFIG.baseURL || 'https://api.deepseek.com/v1',
      streaming: process.env.DEEPSEEK_STREAMING ? process.env.DEEPSEEK_STREAMING === 'true' : DEFAULT_DEEPSEEK_CONFIG.streaming || true,
      timeout: process.env.DEEPSEEK_TIMEOUT ? parseInt(process.env.DEEPSEEK_TIMEOUT) : DEFAULT_DEEPSEEK_CONFIG.timeout || 30000
    };
  }

  getApiKey(): string | null {
    return process.env.DEEPSEEK_API_KEY || null;
  }

  validateConfig(): boolean {
    return !!process.env.DEEPSEEK_API_KEY;
  }
}
