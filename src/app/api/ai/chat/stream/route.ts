import { NextRequest, NextResponse } from 'next/server';
import { DeepSeekClient } from '@/lib/ai';
import { ChatMessage } from '@/lib/ai/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, systemPrompt, config } = body;

    // 验证请求数据
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: '消息数组不能为空' },
        { status: 400 }
      );
    }

    // 初始化 DeepSeek 客户端
    const client = new DeepSeekClient();

    if (!client.isConfigured()) {
      return NextResponse.json(
        { error: 'AI 服务未配置，请检查环境变量 DEEPSEEK_API_KEY' },
        { status: 500 }
      );
    }

    // 创建流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 发送流式聊天请求
          for await (const chunk of client.streamChat(messages as ChatMessage[])) {
            const data = JSON.stringify({
              content: chunk,
              isComplete: false,
              timestamp: new Date().toISOString()
            });
            
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }

          // 发送完成信号
          const finalData = JSON.stringify({
            content: '',
            isComplete: true,
            timestamp: new Date().toISOString()
          });
          
          controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
          controller.close();

        } catch (error) {
          console.error('流式聊天错误:', error);
          
          const errorData = JSON.stringify({
            error: '流式聊天失败',
            details: error instanceof Error ? error.message : '未知错误',
            timestamp: new Date().toISOString()
          });
          
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('流式聊天 API 错误:', error);
    
    return NextResponse.json(
      { 
        error: '流式聊天服务请求失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI 流式聊天 API',
    usage: 'POST /api/ai/chat/stream - 发送流式聊天消息'
  });
}
