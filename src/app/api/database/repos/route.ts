import { NextRequest, NextResponse } from 'next/server';
import { RepoService } from '@/lib/database/repos';
import { prisma } from '@/lib/prisma';
import { SearchQueryAnalyzer, type SearchQueryAnalysis } from '@/lib/ai/search-query-analyzer';

type RepoWithTags = Awaited<ReturnType<typeof prisma.repo.findMany<{
  include: {
    repoAiTags: {
      include: {
        tag: true;
      };
    };
  };
}>>>[number];

const KNOWN_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'java',
  'go',
  'rust',
  'c++',
  'c#',
  'php',
  'ruby',
  'swift',
  'kotlin',
  'dart',
  'scala',
  'clojure',
  'elixir',
  'haskell'
];

const TEXT_WEIGHTS = {
  name: 0.4,
  fullName: 0.35,
  description: 0.3,
  customDescription: 0.32,
  topics: 0.25,
  aiTags: 0.22,
  customTags: 0.24,
  aiSummary: 0.15,
  aiPlatforms: 0.18,
  language: 0.12
};

const normalizeTerm = (term: string): string => term.trim().toLowerCase();

const computeTextScore = (text: string | null | undefined, terms: string[]): number => {
  if (!text || terms.length === 0) return 0;
  const lowerText = text.toLowerCase();
  let matches = 0;
  terms.forEach(term => {
    if (term && lowerText.includes(term)) {
      matches += 1;
    }
  });
  return matches / terms.length;
};

const computeArrayScore = (values: string[] | null | undefined, terms: string[]): number => {
  if (!values || values.length === 0 || terms.length === 0) return 0;
  const lowerValues = values.map(value => value.toLowerCase());
  let matches = 0;
  terms.forEach(term => {
    if (term && lowerValues.some(value => value.includes(term))) {
      matches += 1;
    }
  });
  return matches / terms.length;
};

const deriveRepoPlatforms = (repo: RepoWithTags): string[] => {
  const result = new Set<string>();
  const platformKeywords: Record<string, string[]> = {
    web: ['web', 'browser', 'frontend', 'website'],
    cli: ['cli', 'command line', 'terminal', '命令行'],
    docker: ['docker', 'container'],
    ios: ['ios', 'iphone', 'ipad'],
    android: ['android'],
    linux: ['linux'],
    windows: ['windows'],
    mac: ['mac', 'macos', 'osx'],
    cloud: ['cloud', 'aws', 'azure', 'gcp']
  };

  const checkValue = (value: string) => {
    const lowerValue = value.toLowerCase();
    Object.entries(platformKeywords).forEach(([platform, keywords]) => {
      if (keywords.some(keyword => lowerValue.includes(keyword))) {
        result.add(platform);
      }
    });
  };

  repo.topics?.forEach(checkValue);
  repo.repoAiTags?.forEach(tag => checkValue(tag.tag.name));
  if (repo.language) {
    checkValue(repo.language);
  }

  return Array.from(result);
};

const calculateScore = (repo: RepoWithTags, analysis: SearchQueryAnalysis): number => {
  const keywords = analysis.keywords.map(normalizeTerm);
  const synonyms = analysis.synonyms.map(normalizeTerm);
  const secondaryKeywords = analysis.secondaryKeywords.map(normalizeTerm);
  const technicalKeywords = analysis.technicalKeywords.map(normalizeTerm);
  const categories = analysis.categories.map(normalizeTerm);
  const platforms = analysis.platforms.map(normalizeTerm);

  const nameTerms = Array.from(new Set([...keywords, ...synonyms]));
  const descriptionTerms = Array.from(new Set([...keywords, ...synonyms, ...secondaryKeywords, ...categories]));
  const tagTerms = Array.from(new Set([...keywords, ...synonyms, ...categories]));
  const summaryTerms = Array.from(new Set([...keywords, ...secondaryKeywords, ...technicalKeywords]));
  const platformTerms = platforms;

  const languageTerms = Array.from(new Set([
    ...platforms,
    ...keywords.filter(term => KNOWN_LANGUAGES.includes(term))
  ]));

  const repoAiTags = repo.repoAiTags?.map(tag => tag.tag.name) || [];
  const repoPlatforms = deriveRepoPlatforms(repo);

  const score = (
    TEXT_WEIGHTS.name * computeTextScore(repo.name, nameTerms) +
    TEXT_WEIGHTS.fullName * computeTextScore(repo.fullName, nameTerms) +
    TEXT_WEIGHTS.description * computeTextScore(repo.description, descriptionTerms) +
    TEXT_WEIGHTS.customDescription * computeTextScore(repo.aiDescription, descriptionTerms) +
    TEXT_WEIGHTS.topics * computeArrayScore(repo.topics || [], tagTerms) +
    TEXT_WEIGHTS.aiTags * computeArrayScore(repoAiTags, tagTerms) +
    TEXT_WEIGHTS.customTags * computeArrayScore(repoAiTags, tagTerms) +
    TEXT_WEIGHTS.aiSummary * computeTextScore(repo.aiDescription, summaryTerms) +
    TEXT_WEIGHTS.aiPlatforms * computeArrayScore(repoPlatforms, platformTerms) +
    TEXT_WEIGHTS.language * computeTextScore(repo.language, languageTerms)
  );

  return score;
};

const buildCandidateQuery = (analysis: SearchQueryAnalysis) => {
  const terms = Array.from(new Set([
    ...analysis.keywords,
    ...analysis.secondaryKeywords,
    ...analysis.technicalKeywords,
    ...analysis.synonyms,
    ...analysis.categories
  ].map(normalizeTerm))).filter(Boolean);

  const orConditions: Array<Record<string, { contains: string; mode: 'insensitive' }>> = [];

  const addTextConditions = (field: 'name' | 'fullName' | 'description' | 'aiDescription', sourceTerms: string[]) => {
    sourceTerms.forEach(term => {
      orConditions.push({ [field]: { contains: term, mode: 'insensitive' } });
    });
  };

  addTextConditions('name', terms);
  addTextConditions('fullName', terms);
  addTextConditions('description', terms);
  addTextConditions('aiDescription', terms);

  analysis.platforms.map(normalizeTerm).forEach(platform => {
    orConditions.push({ language: { contains: platform, mode: 'insensitive' } });
  });

  return orConditions;
};

const searchWithWeights = async (
  query: string,
  page: number,
  perPage: number,
  analyzer: SearchQueryAnalyzer
) => {
  const analysis = await analyzer.analyzeQuery(query);

  if (!analysis) {
    return null;
  }

  const skip = (page - 1) * perPage;

  const candidateConditions = buildCandidateQuery(analysis);

  if (candidateConditions.length === 0) {
    return null;
  }

  const candidates = await prisma.repo.findMany({
    where: {
      isDeleted: false,
      OR: candidateConditions
    },
    take: 200,
    include: {
      repoAiTags: {
        include: {
          tag: true
        }
      }
    }
  });

  if (candidates.length === 0) {
    return { repos: [], total: 0 };
  }

  const scored = candidates
    .map(repo => ({ repo, score: calculateScore(repo, analysis) }))
    .filter(item => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return (b.repo.stars || 0) - (a.repo.stars || 0);
    });

  const total = scored.length;
  const paginated = scored.slice(skip, skip + perPage);

  return {
    repos: paginated.map(item => ({ ...item.repo, __score: item.score })),
    total
  };
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '12');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    const search = searchParams.get('search') || '';

    // 计算偏移量
    const skip = (page - 1) * perPage;

    let repos;
    let totalCount;

    if (search) {
      const analyzer = new SearchQueryAnalyzer();
      let weightedResult = null;

      if (analyzer.isAvailable()) {
        weightedResult = await searchWithWeights(search, page, perPage, analyzer);
      }

      if (weightedResult) {
        repos = weightedResult.repos;
        totalCount = weightedResult.total;
      } else {
        // 退化为基础搜索
        repos = await RepoService.search(search);
        totalCount = repos.length;
        repos = repos.slice(skip, skip + perPage);
      }
    } else if (tags.length > 0) {
      // 按标签筛选
      repos = await RepoService.findByTags(tags);
      totalCount = repos.length;
      // 分页
      repos = repos.slice(skip, skip + perPage);
    } else {
      // 获取所有仓库
      repos = await RepoService.findAll();
      totalCount = repos.length;
      // 分页
      repos = repos.slice(skip, skip + perPage);
    }

    // 转换为前端需要的格式
    const formattedRepos = repos.map(repo => {
      // 确保 repoAiTags 存在
      const repoWithTags = repo as RepoWithTags;
      return {
        id: repo.id, // 保持字符串类型，因为数据库ID是CUID字符串
        name: repo.name,
        full_name: repo.fullName,
        description: repo.description || null, // 原始 GitHub 描述
        aiDescription: repo.aiDescription || null, // AI 生成的描述
        stargazers_count: repo.stars,
        language: repo.language,
        topics: repo.topics || [], // 原始 GitHub 标签
        aiTags: repoWithTags.repoAiTags?.map(repoAiTag => repoAiTag.tag.name) || [], // AI分析的标签（从关联表提取）
        html_url: repo.url,
        created_at: repo.createdAt.toISOString(),
        updated_at: repo.updatedAt.toISOString(),
        score: (repo as { __score?: number }).__score ?? undefined
      };
    });

    return NextResponse.json({
      repos: formattedRepos,
      pagination: {
        page,
        per_page: perPage,
        has_next: skip + perPage < totalCount,
        has_prev: page > 1
      },
      total: totalCount
    });

  } catch (error) {
    console.error('获取数据库仓库失败:', error);
    return NextResponse.json(
      { 
        error: '获取仓库数据失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
