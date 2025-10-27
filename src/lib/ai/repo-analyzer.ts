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

**重要：你必须使用中文进行所有分析和输出，包括描述、标签和推理过程。**

请按照以下要求进行分析：

1. **描述生成**：
   - 基于仓库名称、描述、语言、文件结构等信息
   - 生成简洁、准确的中文描述（50-200字）
   - 突出仓库的主要功能和特点
   - **必须使用中文，不能使用英文**
   - **当没有README时，重点分析文件结构和配置文件**

2. **标签分类**：
   - **语言标签**：识别主要编程语言（如 JavaScript, TypeScript, Python, Java, Go, Rust 等）
   - **框架标签**：识别使用的框架和库（如 React, Vue, Express, Django, Next.js, Nuxt.js 等）
   - **功能标签**：识别主要功能（如 Web应用, API, 工具库, 学习项目, 性能测试, 自动化工具 等）
   - **技术标签**：识别具体技术（如 AI, 机器学习, 深度学习, 区块链, 微服务, 容器化 等）
   - **工具标签**：识别开发工具和平台（如 MCP, Docker, Kubernetes, CI/CD, 测试工具, 监控工具 等）
   - **领域标签**：识别应用领域（如 游戏开发, 数据分析, 图像处理, 自然语言处理, 推荐系统 等）
   - **分类标签**：识别项目类型（如 前端, 后端, 全栈, 移动端, 桌面应用, 命令行工具 等）
   - **所有标签必须使用中文，要具体、有意义，不要过于宽泛**

3. **无README时的特殊处理**：
   - 重点分析文件结构中的配置文件（package.json, requirements.txt, pom.xml, Cargo.toml等）
   - 通过目录结构推断项目架构（src/, lib/, app/, components/等）
   - 通过测试文件推断项目质量（test/, tests/, __tests__/等）
   - 通过构建文件推断部署方式（Dockerfile, docker-compose.yml, .github/workflows/等）
   - 通过文档目录推断项目完整性（docs/, documentation/等）

4. **输出格式**：
   请严格按照以下JSON格式输出，不要包含任何其他内容：
   {
     "description": "仓库的中文描述（必须使用中文，50-200字）",
     "tags": {
       "languages": ["语言1", "语言2"],
       "frameworks": ["框架1", "框架2"],
       "features": ["功能1", "功能2"],
       "technologies": ["技术1", "技术2"],
       "tools": ["工具1", "工具2"],
       "domains": ["领域1", "领域2"],
       "categories": ["分类1", "分类2"]
     },
     "confidence": 0.85,
     "reasoning": "分析推理过程（必须使用中文）"
   }

**严格要求**：
- 所有输出必须使用中文，包括描述、标签和推理过程
- confidence 范围 0-1，表示分析结果的置信度
- 标签要准确、简洁，避免重复，必须使用中文
- 如果信息不足，请在 reasoning 中说明（使用中文）
- 不要使用任何英文单词或短语
- 当没有README时，confidence可以适当降低，但要在reasoning中说明原因`;
  }

  /**
   * 构建用户提示词
   */
  private buildUserPrompt(repoData: RepoAnalysisRequest): string {
    let prompt = `请分析以下代码仓库信息，**必须使用中文进行所有输出**：

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

    // 处理 README 内容
    if (repoData.readmeContent) {
      prompt += `\n\n**README内容**：\n${repoData.readmeContent}`;
    } else {
      prompt += `\n\n**注意**：此仓库没有 README 文件，请主要基于仓库名称、描述、语言和文件结构进行分析。`;
    }

    if (repoData.fileStructure && repoData.fileStructure.length > 0) {
      prompt += `\n\n**文件结构**：\n${repoData.fileStructure.join('\n')}`;
      
      // 如果没有 README，提供额外的文件结构分析指导
      if (!repoData.readmeContent) {
        prompt += `\n\n**文件结构分析指导**（无README时使用）：
- 查看配置文件（package.json, requirements.txt, pom.xml, Cargo.toml 等）推断项目类型和依赖
- 查看源代码目录结构推断架构模式（src/, lib/, app/, components/等）
- 查看测试文件推断项目质量（test/, tests/, __tests__/等）
- 查看文档目录推断项目完整性（docs/, documentation/等）
- 查看构建文件推断部署方式（Dockerfile, docker-compose.yml, .github/workflows/等）
- 查看配置文件推断技术栈（tsconfig.json, webpack.config.js, vite.config.js等）
- 查看许可证和贡献指南推断项目开放程度`;
        
        // 分析文件结构中的关键信息
        const configFiles = repoData.fileStructure.filter(file => 
          /\.(json|toml|yml|yaml|txt|xml)$/i.test(file) && 
          !/\.(md|txt)$/i.test(file)
        );
        
        const testFiles = repoData.fileStructure.filter(file => 
          /test|spec|__tests__/i.test(file)
        );
        
        const docFiles = repoData.fileStructure.filter(file => 
          /docs?|documentation|wiki/i.test(file)
        );
        
        if (configFiles.length > 0) {
          prompt += `\n\n**发现的配置文件**：${configFiles.slice(0, 5).join(', ')}`;
        }
        
        if (testFiles.length > 0) {
          prompt += `\n**发现的测试文件**：${testFiles.slice(0, 3).join(', ')}`;
        }
        
        if (docFiles.length > 0) {
          prompt += `\n**发现的文档文件**：${docFiles.slice(0, 3).join(', ')}`;
        }
      }
    }

    prompt += `\n\n请根据以上信息生成准确的描述和标签。**重要：所有输出必须使用中文，包括描述、标签和推理过程。**`;

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
        technologies: parsed.tags.technologies || [],
        tools: parsed.tags.tools || [],
        domains: parsed.tags.domains || [],
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
        description: '基于仓库信息生成的中文描述',
        tags: {
          languages: [],
          frameworks: [],
          features: [],
          technologies: [],
          tools: [],
          domains: [],
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
