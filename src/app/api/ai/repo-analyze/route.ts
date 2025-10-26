import { NextRequest, NextResponse } from 'next/server';
import { RepoAnalyzer } from '@/lib/ai';
import { RepoAnalysisRequest } from '@/lib/ai/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, fullName, description, language, stars, forks, url, readmeContent, fileStructure } = body;

    // 验证必需字段
    if (!name || !fullName || !url) {
      return NextResponse.json(
        { error: '缺少必需字段：name, fullName, url' },
        { status: 400 }
      );
    }

    // 构建分析请求数据
    const repoData: RepoAnalysisRequest = {
      name,
      fullName,
      url,
      ...(description && { description }),
      ...(language && { language }),
      ...(stars !== undefined && { stars }),
      ...(forks !== undefined && { forks }),
      ...(readmeContent && { readmeContent }),
      ...(fileStructure && Array.isArray(fileStructure) && { fileStructure })
    };

    // 初始化分析器
    const analyzer = new RepoAnalyzer();

    if (!analyzer.isAvailable()) {
      return NextResponse.json(
        { error: 'AI 服务未配置，请检查环境变量 DEEPSEEK_API_KEY' },
        { status: 500 }
      );
    }

    // 执行分析
    const result = await analyzer.analyzeRepo(repoData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || '分析失败' },
        { status: 500 }
      );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Repo 分析 API 错误:', error);
    
    return NextResponse.json(
      { 
        error: 'Repo 分析请求失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Repo AI 分析 API',
    description: '根据仓库信息生成描述和标签',
    endpoints: {
      POST: '/api/ai/repo-analyze - 分析仓库并生成描述和标签'
    },
    requiredFields: ['name', 'fullName', 'url'],
    optionalFields: ['description', 'language', 'stars', 'forks', 'readmeContent', 'fileStructure']
  });
}
