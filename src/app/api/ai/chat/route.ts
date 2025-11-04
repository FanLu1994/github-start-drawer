import { NextRequest, NextResponse } from 'next/server';
import { DeepSeekClient } from '@/lib/ai';
import { ChatMessage, AIResponse } from '@/lib/ai/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body;

    // 验证请求数据
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: '消息数组不能为空' },
        { status: 400 }
      );
    }

    // 验证消息格式
    for (const message of messages) {
      if (!message.role || !message.content) {
        return NextResponse.json(
          { error: '消息格式不正确，必须包含 role 和 content 字段' },
          { status: 400 }
        );
      }
      if (!['user', 'assistant', 'system'].includes(message.role)) {
        return NextResponse.json(
          { error: '消息角色必须是 user、assistant 或 system' },
          { status: 400 }
        );
      }
    }

    // 初始化 DeepSeek 客户端
    const client = new DeepSeekClient();

    if (!client.isConfigured()) {
      return NextResponse.json(
        { error: 'AI 服务未配置，请检查环境变量 DEEPSEEK_API_KEY' },
        { status: 500 }
      );
    }

    // 发送聊天请求
    const response = await client.chat(messages as ChatMessage[]);

    const aiResponse: AIResponse = {
      content: response,
      timestamp: new Date()
    };

    return NextResponse.json(aiResponse);

  } catch (error) {
    console.error('AI 聊天 API 错误:', error);
    
    return NextResponse.json(
      { 
        error: 'AI 服务请求失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI 聊天 API',
    endpoints: {
      POST: '/api/ai/chat - 发送聊天消息',
      GET: '/api/ai/chat/stream - 流式聊天'
    }
  });
}
