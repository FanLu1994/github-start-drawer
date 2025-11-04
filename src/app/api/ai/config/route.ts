import { NextResponse } from 'next/server';
import { ConfigManager } from '@/lib/ai/config';

export async function GET() {
  try {
    const configManager = ConfigManager.getInstance();
    const isConfigured = configManager.validateConfig();
    
    return NextResponse.json({
      configured: isConfigured,
      hasApiKey: !!configManager.getApiKey(),
      message: isConfigured 
        ? 'DeepSeek API 配置正常' 
        : '请配置 DEEPSEEK_API_KEY 环境变量'
    });
  } catch (error) {
    console.error('DeepSeek 配置检查失败:', error);
    return NextResponse.json(
      { 
        configured: false, 
        hasApiKey: false,
        message: '配置检查失败',
        error: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}