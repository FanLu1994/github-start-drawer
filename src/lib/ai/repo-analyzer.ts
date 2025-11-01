import { DeepSeekClient } from './deepseek-client';
import { RepoAnalysisRequest, RepoAnalysisResult, RepoAnalysisResponse } from './types';

/**
 * Repo AI 分析服务
 * 根据仓库信息生成描述和标签
 */
export class RepoAnalyzer {
  private client: DeepSeekClient;

  constructor() {
    this.client = new DeepSeekClient();
  }

  /**
   * 分析仓库并生成描述和标签
   */
  async analyzeRepo(repoData: RepoAnalysisRequest): Promise<RepoAnalysisResponse> {
    try {
      if (!this.client.isConfigured()) {
        return {
          success: false,
          error: 'AI 服务未配置，请检查环境变量 DEEPSEEK_API_KEY',
          timestamp: new Date()
        };
      }

      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(repoData);

      const response = await this.client.sendMessage(userPrompt, systemPrompt);
      const analysisResult = this.parseResponse(response);

      return {
        success: true,
        data: analysisResult,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Repo 分析错误:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '分析失败',
        timestamp: new Date()
      };
    }
  }

  /**
   * 构建系统提示词
   */
  private buildSystemPrompt(): string {
    return `你是一个专业的代码仓库分析专家。你的任务是分析GitHub仓库并提供准确的中文概述和应用分类标签。

**重要：请严格使用中文进行分析和回复，无论原始README是什么语言。**

请以JSON格式回复：
{
  "summary": "你的中文概述",
  "tags": ["标签1", "标签2", "标签3", "标签4", "标签5"]
}

**要求**：
1. summary: 一个简洁的中文概述（不超过50字），说明这个仓库的主要功能和用途
2. tags: 3-5个相关的应用类型标签（用中文，类似应用商店的分类，如：开发工具、Web应用、移动应用、数据库、AI工具等）

**标签选择规则**：
- 如果用户提供了自定义分类列表，请优先从中选择合适的标签
- 如果自定义分类不适用，可以自行创建合适的中文标签
- 标签要准确反映仓库的实用性和分类

重点关注实用性和准确的分类，帮助用户快速理解仓库的用途。`;
  }

  /**
   * 构建用户提示词
   */
  private buildUserPrompt(repoData: RepoAnalysisRequest): string {
    // 1. 仓库信息标准化
    const repoInfo = `
仓库名称: ${repoData.fullName}
描述: ${repoData.description || '无'}
编程语言: ${repoData.language || '无'}
Star数: ${repoData.stars || 0}
主题标签: ${repoData.topics?.join(', ') || '无'}

README内容 (前2000字符):
${repoData.readmeContent ? repoData.readmeContent.substring(0, 2000) : '无README内容'}
    `;

    // 2. 智能分类信息
    const categoriesInfo = repoData.customCategories && repoData.customCategories.length > 0
      ? `\n\n可用的应用分类: ${repoData.customCategories.join(', ')}`
      : '';

    const prompt = `请分析这个GitHub仓库并提供：

1. 一个简洁的中文概述（不超过50字），说明这个仓库的主要功能和用途
2. 3-5个相关的应用类型标签（用中文，类似应用商店的分类，如：开发工具、Web应用、移动应用、数据库、AI工具等，请优先从提供的分类中选择）

重要：请严格使用中文进行分析和回复，无论原始README是什么语言。

请以JSON格式回复：
{
  "summary": "你的中文概述",
  "tags": ["标签1", "标签2", "标签3", "标签4", "标签5"]
}

仓库信息：
${repoInfo}${categoriesInfo}

重点关注实用性和准确的分类，帮助用户快速理解仓库的用途。`;

    return prompt;
  }

  /**
   * 解析AI响应
   */
  private parseResponse(response: string): RepoAnalysisResult {
    try {
      // 尝试提取JSON部分
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法找到JSON格式的响应');
      }

      const jsonStr = jsonMatch[0];
      const parsed = JSON.parse(jsonStr);

      // 验证必要字段
      if (!parsed.summary || !parsed.tags) {
        throw new Error('响应缺少必要字段');
      }

      return {
        summary: parsed.summary,
        tags: Array.isArray(parsed.tags) ? parsed.tags : []
      };

    } catch (error) {
      console.error('解析AI响应失败:', error);
      
      // 返回默认结果
      return {
        summary: '基于仓库信息生成的中文概述',
        tags: []
      };
    }
  }

  /**
   * 检查服务是否可用
   */
  isAvailable(): boolean {
    return this.client.isConfigured();
  }
}
