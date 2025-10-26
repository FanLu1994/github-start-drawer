# Repo AI 分析服务

这个服务可以根据GitHub仓库信息自动生成描述和标签，包括编程语言、框架、功能特性等分类。

## 功能特性

- **智能描述生成**：基于仓库信息生成准确的中文描述
- **多维度标签分类**：
  - 编程语言标签（JavaScript, TypeScript, Python等）
  - 框架/库标签（React, Vue, Express等）
  - 功能特性标签（Web应用, API, 工具库等）
  - 项目分类标签（前端, 后端, 全栈等）
- **置信度评估**：提供分析结果的置信度评分
- **推理过程**：展示AI的分析推理过程

## API 使用

### 端点
```
POST /api/ai/repo-analyze
```

### 请求参数

**必需字段：**
- `name`: 仓库名称
- `fullName`: 完整仓库名称（如 username/repo-name）
- `url`: 仓库URL

**可选字段：**
- `description`: 原始描述
- `language`: 主要编程语言
- `stars`: Star数量
- `forks`: Fork数量
- `readmeContent`: README内容
- `fileStructure`: 文件结构数组

### 请求示例

```javascript
const response = await fetch('/api/ai/repo-analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: "my-react-app",
    fullName: "username/my-react-app",
    url: "https://github.com/username/my-react-app",
    description: "A modern React application with TypeScript",
    language: "TypeScript",
    stars: 150,
    forks: 25,
    readmeContent: "# My React App\n\nA modern React application...",
    fileStructure: [
      "src/",
      "src/components/",
      "package.json",
      "tsconfig.json"
    ]
  })
});

const result = await response.json();
```

### 响应格式

```typescript
interface RepoAnalysisResponse {
  success: boolean;
  data?: {
    description: string;
    tags: {
      languages: string[];
      frameworks: string[];
      features: string[];
      categories: string[];
    };
    confidence: number;
    reasoning: string;
  };
  error?: string;
  timestamp: Date;
}
```

### 响应示例

```json
{
  "success": true,
  "data": {
    "description": "一个现代化的React应用，使用TypeScript构建，具有响应式设计和组件库。",
    "tags": {
      "languages": ["TypeScript", "JavaScript"],
      "frameworks": ["React", "Vite", "Tailwind CSS"],
      "features": ["响应式设计", "组件库", "状态管理"],
      "categories": ["前端", "Web应用", "React项目"]
    },
    "confidence": 0.9,
    "reasoning": "基于package.json、文件结构和README内容，可以确定这是一个React项目..."
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 环境配置

确保设置了以下环境变量：

```bash
DEEPSEEK_API_KEY=your_deepseek_api_key
```

可选配置：
```bash
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_TEMPERATURE=0.7
DEEPSEEK_MAX_TOKENS=2048
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
```

## 测试页面

访问 `/ai-repo-test` 页面可以测试AI分析功能，该页面提供了：
- 交互式表单输入仓库信息
- 实时分析结果显示
- 标签分类可视化
- 置信度评分展示

## 错误处理

常见错误及解决方案：

1. **AI 服务未配置**
   - 检查 `DEEPSEEK_API_KEY` 环境变量是否设置

2. **分析失败**
   - 检查网络连接
   - 验证API密钥有效性
   - 查看控制台错误日志

3. **解析错误**
   - AI响应格式异常时会返回默认结果
   - 置信度会降低到0.3

## 集成到现有项目

```typescript
import { RepoAnalyzer } from '@/lib/ai';

const analyzer = new RepoAnalyzer();

// 检查服务是否可用
if (analyzer.isAvailable()) {
  const result = await analyzer.analyzeRepo({
    name: "my-repo",
    fullName: "user/my-repo",
    url: "https://github.com/user/my-repo",
    // ... 其他字段
  });
  
  if (result.success) {
    console.log('描述:', result.data.description);
    console.log('标签:', result.data.tags);
  }
}
```
