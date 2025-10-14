import { NextRequest, NextResponse } from 'next/server';
import { ConfigManager } from '@/lib/ai';

export async function GET() {
  try {
    const configManager = ConfigManager.getInstance();
    const config = configManager.getConfig();
    const isConfigured = configManager.validateConfig();

    return NextResponse.json({
      isConfigured,
      hasApiKey: !!configManager.getApiKey(),
      config: isConfigured ? {
        model: config?.model,
        temperature: config?.temperature,
        maxTokens: config?.maxTokens,
        baseURL: config?.baseURL,
        streaming: config?.streaming,
        timeout: config?.timeout
      } : null,
      message: isConfigured ? 'DeepSeek AI 已从环境变量加载配置' : '请在环境变量中设置 DEEPSEEK_API_KEY'
    });

  } catch (error) {
    console.error('获取 AI 配置错误:', error);
    
    return NextResponse.json(
      { 
        error: '获取配置失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

