import { NextRequest, NextResponse } from 'next/server';
import { GitHubClient } from '@/lib/github';
import { RepoService } from '@/lib/database/repos';
import { TagService } from '@/lib/database/tags';
import { RepoAnalyzer } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, fullName } = body;

    if (!id && !fullName) {
      return NextResponse.json(
        { error: '需要提供 id 或 fullName 参数' },
        { status: 400 }
      );
    }

    // 查找仓库
    let repo;
    if (id) {
      repo = await RepoService.findById(id);
    } else {
      repo = await RepoService.findByFullName(fullName!);
    }

    if (!repo) {
      return NextResponse.json(
        { error: '仓库不存在' },
        { status: 404 }
      );
    }

    // 检查配置
    const githubClient = new GitHubClient();
    if (!githubClient.isConfigured()) {
      return NextResponse.json(
        { error: 'GitHub 服务未配置' },
        { status: 400 }
      );
    }

    const analyzer = new RepoAnalyzer();
    if (!analyzer.isAvailable()) {
      return NextResponse.json(
        { error: 'AI 服务未配置' },
        { status: 400 }
      );
    }

    // 解析仓库名称
    const [owner, repoName] = repo.fullName.split('/');
    if (!owner || !repoName) {
      return NextResponse.json(
        { error: '仓库名称格式错误' },
        { status: 400 }
      );
    }

    // 获取最新的仓库信息
    const repoDetails = await githubClient.getRepo(owner, repoName);
    
    // 获取README内容
    let readmeContent = '';
    try {
      const readme = await githubClient.getRepoContents(owner, repoName, 'README.md');
      if (readme && typeof readme === 'string') {
        readmeContent = readme;
      }
    } catch (error) {
      console.log(`无法获取 ${repo.fullName} 的README:`, error);
    }

    // 获取文件结构
    let fileStructure: string[] = [];
    try {
      const tree = await githubClient.getRepoTree(owner, repoName, 'HEAD', true);
      fileStructure = tree.slice(0, 50).map(item => item.path); // 限制文件数量
    } catch (error) {
      console.log(`无法获取 ${repo.fullName} 的文件结构:`, error);
    }

    // AI分析
    const analysisResult = await analyzer.analyzeRepo({
      name: repoDetails.name,
      fullName: repoDetails.full_name,
      description: repoDetails.description || undefined,
      language: repoDetails.language || undefined,
      stars: repoDetails.stargazers_count,
      forks: repoDetails.forks_count,
      url: repoDetails.html_url,
      readmeContent,
      fileStructure
    });

    if (analysisResult.success && analysisResult.data) {
      // 合并所有标签分类到一个数组中
      const allTags = [
        ...(analysisResult.data.tags.languages || []),
        ...(analysisResult.data.tags.frameworks || []),
        ...(analysisResult.data.tags.features || []),
        ...(analysisResult.data.tags.technologies || []),
        ...(analysisResult.data.tags.tools || []),
        ...(analysisResult.data.tags.domains || []),
        ...(analysisResult.data.tags.categories || [])
      ];

      // 去重标签
      const uniqueTags = [...new Set(allTags)];

      // 将标签保存到 tags 表
      if (uniqueTags.length > 0) {
        await TagService.createMany(uniqueTags);
      }

      // 更新仓库信息
      await RepoService.update(repo.id, {
        description: repoDetails.description || '',
        stars: repoDetails.stargazers_count,
        forks: repoDetails.forks_count,
        language: repoDetails.language || undefined,
        aiDescription: analysisResult.data.description,
        tags: uniqueTags
      });

      return NextResponse.json({
        message: '重新分析完成',
        repo: {
          id: repo.id,
          name: repo.name,
          fullName: repo.fullName,
          tags: uniqueTags
        }
      });

    } else {
      return NextResponse.json(
        { 
          error: 'AI分析失败',
          details: analysisResult.error || '未知错误'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('重新分析失败:', error);
    return NextResponse.json(
      { 
        error: '重新分析失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
