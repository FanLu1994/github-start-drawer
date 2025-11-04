import { NextResponse } from 'next/server';
import { GitHubConfigManager } from '@/lib/github/config';

export async function GET() {
  try {
    const configManager = GitHubConfigManager.getInstance();
    const isConfigured = configManager.validateConfig();
    
    return NextResponse.json({
      configured: isConfigured,
      hasToken: !!configManager.getToken(),
      message: isConfigured 
        ? 'GitHub API 配置正常' 
        : '请配置 GITHUB_TOKEN 环境变量'
    });
  } catch (error) {
    console.error('GitHub 配置检查失败:', error);
    return NextResponse.json(
      { 
        configured: false, 
        hasToken: false,
        message: '配置检查失败',
        error: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}