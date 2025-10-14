import { NextRequest, NextResponse } from 'next/server';
import { GitHubConfigManager } from '@/lib/github';

export async function GET() {
  try {
    const configManager = GitHubConfigManager.getInstance();
    const config = configManager.getConfig();
    const isConfigured = configManager.validateConfig();

    return NextResponse.json({
      isConfigured,
      hasToken: !!configManager.getToken(),
      config: isConfigured ? {
        baseURL: config?.baseURL,
        timeout: config?.timeout
      } : null,
      message: isConfigured ? 'GitHub token 已从环境变量加载' : '请在环境变量中设置 GITHUB_TOKEN'
    });

  } catch (error) {
    console.error('获取 GitHub 配置错误:', error);
    
    return NextResponse.json(
      { 
        error: '获取配置失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

