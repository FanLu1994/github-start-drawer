import { NextRequest, NextResponse } from 'next/server';
import { GitHubClient } from '@/lib/github';
import { RepoService } from '@/lib/database/repos';
import { TagService } from '@/lib/database/tags';
import { CustomTagService } from '@/lib/database/custom-tags';
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
    
    // 获取README内容（支持多种格式）
    let readmeContent = '';
    const readmeFiles = ['README.md', 'README.rst', 'README.txt', 'README', 'readme.md', 'readme.rst', 'readme.txt', 'readme'];
    
    for (const readmeFile of readmeFiles) {
      try {
        const readme = await githubClient.getFileContent(owner, repoName, readmeFile);
        if (readme && readme.content) {
          // 解码 base64 内容
          readmeContent = Buffer.from(readme.content, 'base64').toString('utf-8');
          console.log(`成功获取 ${repo.fullName} 的 ${readmeFile}`);
          break;
        }
      } catch {
        // 继续尝试下一个文件
        continue;
      }
    }
    
    if (!readmeContent) {
      console.log(`仓库 ${repo.fullName} 没有找到任何 README 文件`);
    }

    // 获取文件结构（增强版，优先获取重要文件）
    let fileStructure: string[] = [];
    let importantFiles: string[] = [];
    
    try {
      const tree = await githubClient.getRepoTree(owner, repoName, 'HEAD', true);
      
      // 定义重要文件模式
      const importantPatterns = [
        /package\.json$/i,
        /requirements\.txt$/i,
        /pom\.xml$/i,
        /Cargo\.toml$/i,
        /composer\.json$/i,
        /Gemfile$/i,
        /Dockerfile$/i,
        /docker-compose\.yml$/i,
        /Makefile$/i,
        /CMakeLists\.txt$/i,
        /\.github\/workflows\//i,
        /tsconfig\.json$/i,
        /webpack\.config\./i,
        /vite\.config\./i,
        /next\.config\./i,
        /nuxt\.config\./i,
        /\.env\.example$/i,
        /README/i,
        /LICENSE/i,
        /CHANGELOG/i,
        /CONTRIBUTING/i
      ];
      
      // 分离重要文件和普通文件
      const allFiles = tree.map(item => item.path);
      importantFiles = allFiles.filter(path => 
        importantPatterns.some(pattern => pattern.test(path))
      );
      
      // 获取其他文件（排除重要文件）
      const otherFiles = allFiles.filter(path => 
        !importantPatterns.some(pattern => pattern.test(path))
      );
      
      // 优先显示重要文件，然后显示其他文件（限制总数）
      fileStructure = [
        ...importantFiles.slice(0, 20), // 最多20个重要文件
        ...otherFiles.slice(0, 30)      // 最多30个其他文件
      ];
      
      console.log(`获取 ${repo.fullName} 文件结构: ${allFiles.length} 个文件，其中 ${importantFiles.length} 个重要文件`);
      
    } catch (error) {
      console.log(`无法获取 ${repo.fullName} 的文件结构:`, error);
    }

    // 获取自定义标签
    const customTags = await CustomTagService.findAll();
    const customCategories = customTags.map(tag => tag.content);

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
      fileStructure,
      topics: repoDetails.topics || [],
      customCategories
    });

    if (analysisResult.success && analysisResult.data) {
      // 标签去重
      const uniqueTags = [...new Set(analysisResult.data.tags)];

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
        aiDescription: analysisResult.data.summary,
        topics: repoDetails.topics || [],
        aiTags: uniqueTags
      });

      return NextResponse.json({
        message: '重新分析完成',
        repo: {
          id: repo.id,
          name: repo.name,
          fullName: repo.fullName,
          topics: repoDetails.topics || [],
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
