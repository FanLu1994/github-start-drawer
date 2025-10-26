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
    return `你是一个专业的代码仓库分析专家。你的任务是根据提供的仓库信息，生成准确的描述和标签。

请按照以下要求进行分析：

1. **描述生成**：
   - 基于仓库名称、描述、语言、文件结构等信息
   - 生成简洁、准确的中文描述（50-200字）
   - 突出仓库的主要功能和特点

2. **标签分类**：
   - **语言标签**：识别主要编程语言（如 JavaScript, TypeScript, Python, Java 等）
   - **框架标签**：识别使用的框架和库（如 React, Vue, Express, Django 等）
   - **功能标签**：识别主要功能（如 Web应用, API, 工具库, 学习项目 等）
   - **分类标签**：识别项目类型（如 前端, 后端, 全栈, 移动端, 桌面应用 等）

3. **输出格式**：
   请严格按照以下JSON格式输出，不要包含任何其他内容：
   {
     "description": "仓库的中文描述",
     "tags": {
       "languages": ["语言1", "语言2"],
       "frameworks": ["框架1", "框架2"],
       "features": ["功能1", "功能2"],
       "categories": ["分类1", "分类2"]
     },
     "confidence": 0.85,
     "reasoning": "分析推理过程"
   }

注意：
- confidence 范围 0-1，表示分析结果的置信度
- 标签要准确、简洁，避免重复
- 如果信息不足，请在 reasoning 中说明`;
  }

  /**
   * 构建用户提示词
   */
  private buildUserPrompt(repoData: RepoAnalysisRequest): string {
    let prompt = `请分析以下代码仓库信息：

**基本信息**：
- 仓库名称：${repoData.name}
- 完整名称：${repoData.fullName}
- 仓库URL：${repoData.url}`;

    if (repoData.description) {
      prompt += `\n- 原始描述：${repoData.description}`;
    }

    if (repoData.language) {
      prompt += `\n- 主要语言：${repoData.language}`;
    }

    if (repoData.stars !== undefined) {
      prompt += `\n- Star数：${repoData.stars}`;
    }

    if (repoData.forks !== undefined) {
      prompt += `\n- Fork数：${repoData.forks}`;
    }

    if (repoData.readmeContent) {
      prompt += `\n\n**README内容**：\n${repoData.readmeContent}`;
    }

    if (repoData.fileStructure && repoData.fileStructure.length > 0) {
      prompt += `\n\n**文件结构**：\n${repoData.fileStructure.join('\n')}`;
    }

    prompt += `\n\n请根据以上信息生成准确的描述和标签。`;

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
      if (!parsed.description || !parsed.tags) {
        throw new Error('响应缺少必要字段');
      }

      // 确保tags对象包含所有必要字段
      const tags = {
        languages: parsed.tags.languages || [],
        frameworks: parsed.tags.frameworks || [],
        features: parsed.tags.features || [],
        categories: parsed.tags.categories || []
      };

      return {
        description: parsed.description,
        tags,
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
        reasoning: parsed.reasoning || '基于提供的信息进行分析'
      };

    } catch (error) {
      console.error('解析AI响应失败:', error);
      
      // 返回默认结果
      return {
        description: '基于仓库信息生成的描述',
        tags: {
          languages: [],
          frameworks: [],
          features: [],
          categories: []
        },
        confidence: 0.3,
        reasoning: '解析失败，返回默认结果'
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
