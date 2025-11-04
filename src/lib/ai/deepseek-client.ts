import { ChatDeepSeek } from '@langchain/deepseek';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { ConfigManager } from './config';

/**
 * DeepSeek AI 客户端
 */
export class DeepSeekClient {
  private model!: ChatDeepSeek;
  private configManager: ConfigManager;

  constructor() {
    this.configManager = ConfigManager.getInstance();
    this.initializeModel();
  }

  private initializeModel(): void {
    const config = this.configManager.getConfig();

    if (!config) {
      throw new Error('DeepSeek API key is required. Please set DEEPSEEK_API_KEY environment variable.');
    }

    this.model = new ChatDeepSeek({
      apiKey: config.apiKey,
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens
    });
  }

  /**
   * 发送聊天消息
   */
  async chat(messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>): Promise<string> {
    try {
      const langchainMessages = messages.map(msg => {
        switch (msg.role) {
          case 'user':
            return new HumanMessage(msg.content);
          case 'assistant':
            return new AIMessage(msg.content);
          case 'system':
            return new SystemMessage(msg.content);
          default:
            return new HumanMessage(msg.content);
        }
      });

      const response = await this.model.invoke(langchainMessages);
      return response.content as string;
    } catch (error) {
      console.error('DeepSeek API 错误:', error);
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw new Error('DeepSeek API key 无效或未设置，请检查环境变量 DEEPSEEK_API_KEY');
        }
        if (error.message.includes('rate limit')) {
          throw new Error('API 请求频率过高，请稍后重试');
        }
        if (error.message.includes('timeout')) {
          throw new Error('请求超时，请检查网络连接');
        }
      }
      throw new Error(`AI 请求失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 发送单条消息
   */
  async sendMessage(message: string, systemPrompt?: string): Promise<string> {
    const messages = [];
    
    if (systemPrompt) {
      messages.push({ role: 'system' as const, content: systemPrompt });
    }
    
    messages.push({ role: 'user' as const, content: message });
    
    return this.chat(messages);
  }

  /**
   * 流式响应
   */
  async *streamChat(messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>): AsyncGenerator<string, void, unknown> {
    try {
      const langchainMessages = messages.map(msg => {
        switch (msg.role) {
          case 'user':
            return new HumanMessage(msg.content);
          case 'assistant':
            return new AIMessage(msg.content);
          case 'system':
            return new SystemMessage(msg.content);
          default:
            return new HumanMessage(msg.content);
        }
      });

      const stream = await this.model.stream(langchainMessages);
      
      for await (const chunk of stream) {
        if (chunk.content) {
          yield chunk.content as string;
        }
      }
    } catch (error) {
      console.error('DeepSeek 流式 API 错误:', error);
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw new Error('DeepSeek API key 无效或未设置，请检查环境变量 DEEPSEEK_API_KEY');
        }
        if (error.message.includes('rate limit')) {
          throw new Error('API 请求频率过高，请稍后重试');
        }
        if (error.message.includes('timeout')) {
          throw new Error('请求超时，请检查网络连接');
        }
      }
      throw new Error(`AI 流式请求失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 流式发送单条消息
   */
  async *streamMessage(message: string, systemPrompt?: string): AsyncGenerator<string, void, unknown> {
    const messages = [];
    
    if (systemPrompt) {
      messages.push({ role: 'system' as const, content: systemPrompt });
    }
    
    messages.push({ role: 'user' as const, content: message });
    
    yield* this.streamChat(messages);
  }


  /**
   * 检查配置是否有效
   */
  isConfigured(): boolean {
    return this.configManager.validateConfig();
  }
}
