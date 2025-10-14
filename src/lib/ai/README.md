# AI 工具模块

基于 LangChain.js 和 DeepSeek 的 AI 工具模块，提供完整的 AI 聊天功能。

## 功能特性

- 🤖 支持 DeepSeek AI 模型
- 🔧 灵活的 API key 管理
- 💬 完整的聊天对话功能
- 🌊 支持流式响应
- ⚙️ 可配置的模型参数
- 🛡️ 类型安全的 TypeScript 支持

## 快速开始

### 1. 环境配置

创建 `.env.local` 文件并添加您的 DeepSeek API key：

```bash
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

### 2. 基本使用

```typescript
import { DeepSeekClient } from '@/lib/ai';

// 初始化客户端
const client = new DeepSeekClient({
  apiKey: 'your-api-key',
  model: 'deepseek-chat',
  temperature: 0.7,
  maxTokens: 2048
});

// 发送消息
const response = await client.sendMessage('你好，请介绍一下自己');
console.log(response);

// 流式响应
for await (const chunk of client.streamMessage('写一首诗')) {
  console.log(chunk);
}
```

### 3. API 路由使用

#### 聊天 API

```typescript
// POST /api/ai/chat
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: '你好' }
    ]
  })
});

const data = await response.json();
console.log(data.content);
```

#### 流式聊天 API

```typescript
// POST /api/ai/chat/stream
const response = await fetch('/api/ai/chat/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: '写一个故事' }
    ]
  })
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      console.log(data.content);
    }
  }
}
```

#### 配置管理 API

```typescript
// GET /api/ai/config - 获取配置状态
const config = await fetch('/api/ai/config');
const data = await config.json();

// POST /api/ai/config - 更新配置
await fetch('/api/ai/config', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    apiKey: 'your-new-api-key',
    model: 'deepseek-chat',
    temperature: 0.8
  })
});
```

## API 参考

### DeepSeekClient

#### 构造函数

```typescript
new DeepSeekClient(config?: DeepSeekConfig)
```

#### 方法

- `chat(messages: ChatMessage[]): Promise<string>` - 发送聊天消息
- `sendMessage(message: string, systemPrompt?: string): Promise<string>` - 发送单条消息
- `streamChat(messages: ChatMessage[]): AsyncGenerator<string>` - 流式聊天
- `streamMessage(message: string, systemPrompt?: string): AsyncGenerator<string>` - 流式单条消息
- `updateConfig(config: Partial<DeepSeekConfig>): void` - 更新配置
- `isConfigured(): boolean` - 检查配置状态

### 类型定义

```typescript
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

interface DeepSeekConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  baseURL?: string;
}
```

## 测试页面

访问 `/ai-test` 页面可以测试 AI 功能：

1. 输入您的 DeepSeek API key
2. 点击"配置"按钮
3. 开始与 AI 对话

## 注意事项

- 确保您有有效的 DeepSeek API key
- 建议在生产环境中使用环境变量管理 API key
- 流式响应需要处理 SSE (Server-Sent Events) 格式
- 所有 API 都包含错误处理和验证
