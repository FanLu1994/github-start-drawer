"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RepoCard } from "@/components/repo-card";
import { GitHubConfigPrompt } from "@/components/github-config-prompt";
import { Search, Github, Code, Database, Cpu, Globe, Smartphone, Zap, Shield, ChevronLeft, ChevronRight, Loader2, LucideIcon } from "lucide-react";

interface ConfigStatus {
  configured: boolean;
  hasToken?: boolean;
  hasApiKey?: boolean;
  message: string;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  topics: string[];
  html_url: string;
  created_at: string;
  updated_at: string;
}

interface ReposResponse {
  repos: GitHubRepo[];
  pagination: {
    page: number;
    per_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
  total: number;
}

export default function Home() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [githubConfig, setGithubConfig] = useState<ConfigStatus | null>(null);
  const [deepseekConfig, setDeepseekConfig] = useState<ConfigStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<ReposResponse['pagination'] | null>(null);
  const [reposLoading, setReposLoading] = useState(false);
  const [reposError, setReposError] = useState<string | null>(null);

  // 检查API配置
  useEffect(() => {
    const checkConfigs = async () => {
      try {
        // 并行检查两个配置
        const [githubResponse, deepseekResponse] = await Promise.all([
          fetch('/api/github/config'),
          fetch('/api/ai/config')
        ]);
        
        const githubData = await githubResponse.json();
        const deepseekData = await deepseekResponse.json();
        
        setGithubConfig(githubData);
        setDeepseekConfig(deepseekData);
      } catch (error) {
        console.error('检查配置失败:', error);
        setGithubConfig({
          configured: false,
          hasToken: false,
          message: 'GitHub配置检查失败'
        });
        setDeepseekConfig({
          configured: false,
          hasApiKey: false,
          message: 'DeepSeek配置检查失败'
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkConfigs();
  }, []);

  // 获取仓库数据
  const fetchRepos = async (page: number = 1) => {
    setReposLoading(true);
    setReposError(null);
    
    try {
      const response = await fetch(`/api/database/repos?page=${page}&per_page=12`);
      if (!response.ok) {
        throw new Error('获取仓库数据失败');
      }
      
      const data: ReposResponse = await response.json();
      setRepos(data.repos);
      setPagination(data.pagination);
      
    } catch (error) {
      console.error('获取仓库失败:', error);
      setReposError(error instanceof Error ? error.message : '获取仓库数据失败');
    } finally {
      setReposLoading(false);
    }
  };

  // 获取标签数据
  const fetchTags = async () => {
    try {
      const response = await fetch('/api/database/tags');
      if (!response.ok) {
        throw new Error('获取标签数据失败');
      }
      
      const data = await response.json();
      setAllTags(data.tags.sort());
    } catch (error) {
      console.error('获取标签失败:', error);
    }
  };

  // 当配置检查完成后，获取数据
  useEffect(() => {
    if (githubConfig?.configured && deepseekConfig?.configured) {
      fetchRepos(currentPage);
      fetchTags();
    }
  }, [githubConfig?.configured, deepseekConfig?.configured, currentPage]);

  // 图标映射
  const getIconForLanguage = (language: string | null): LucideIcon => {
    const iconMap: Record<string, LucideIcon> = {
      'JavaScript': Code,
      'TypeScript': Code,
      'Python': Database,
      'Java': Cpu,
      'Go': Globe,
      'Rust': Shield,
      'C++': Cpu,
      'React': Smartphone,
      'Vue': Smartphone,
      'Node.js': Zap,
      'default': Github
    };
    return iconMap[language || ''] || iconMap.default;
  };

  // 根据搜索查询筛选标签
  const filteredTags = allTags.filter(tag =>
    tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 筛选逻辑
  const filteredRepos = selectedTags.length === 0 
    ? repos 
    : repos.filter(repo => {
        const repoLanguages = repo.language ? [repo.language] : [];
        const repoTopics = repo.topics || [];
        const allRepoTags = [...repoLanguages, ...repoTopics];
        return selectedTags.some(tag => allRepoTags.includes(tag));
      });

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setSelectedTags([]); // 切换页面时清空选中的标签
  };

  // 如果正在加载，显示加载状态
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">检查配置中...</p>
        </div>
      </div>
    );
  }

  // 如果任一API未配置，显示配置提示
  if (!githubConfig?.configured || !deepseekConfig?.configured) {
    return <GitHubConfigPrompt />;
  }

  return (
    <div className="h-screen relative bg-background overflow-hidden">
      <div className="flex h-screen relative z-10">
        {/* 左侧 Sidebar */}
        <div className="w-80 bg-card/30 border-r border-border p-6 overflow-y-auto backdrop-blur-md">
          <h2 className="text-xl font-bold text-card-foreground mb-4">Repo 标签</h2>
          
          {/* 标签搜索器 */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="搜索标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            {filteredTags.length > 0 ? (
              filteredTags.map((tag) => (
                <Button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  variant="outline"
                  className={`w-full justify-start transition-all duration-200 ${
                    selectedTags.includes(tag) 
                      ? "bg-primary/30 border-primary/50 text-primary-foreground shadow-lg backdrop-blur-sm" 
                      : "bg-card/20 border-border text-card-foreground hover:bg-primary/20 hover:border-primary/30 backdrop-blur-sm"
                  }`}
                >
                  {tag}
                </Button>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p>没有找到匹配的标签</p>
              </div>
            )}
          </div>
          
          {selectedTags.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-card-foreground/80 mb-2">已选择标签:</h3>
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="cursor-pointer bg-primary/20 border-primary/40 text-primary-foreground hover:bg-destructive/30 hover:border-destructive/50 transition-all duration-200 backdrop-blur-sm"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 右侧主内容区 */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">GitHub Star Drawer</h1>
            <p className="text-foreground/80">
              {selectedTags.length === 0 
                ? "显示所有仓库" 
                : `显示包含标签: ${selectedTags.join(", ")} 的仓库`
              }
            </p>
          </div>

          {/* 仓库列表 */}
          {reposLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">加载仓库中...</p>
              </div>
            </div>
          ) : reposError ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">{reposError}</p>
              <Button onClick={() => fetchRepos(currentPage)} variant="outline">
                重试
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-6">
                {filteredRepos.map((repo) => {
                  const IconComponent = getIconForLanguage(repo.language);
                  const repoLanguages = repo.language ? [repo.language] : [];
                  const repoTopics = repo.topics || [];
                  const allRepoTags = [...repoLanguages, ...repoTopics];
                  
                  return (
                    <div key={repo.id} className="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]">
                      <RepoCard
                        id={repo.id}
                        name={repo.name}
                        description={repo.description || '暂无描述'}
                        stars={repo.stargazers_count}
                        tags={allRepoTags}
                        icon={IconComponent}
                        url={repo.html_url}
                      />
                    </div>
                  );
                })}
              </div>

              {filteredRepos.length === 0 && repos.length > 0 && (
                <div className="text-center py-12">
                  <p className="text-foreground/70">没有找到匹配的仓库</p>
                </div>
              )}

              {/* 分页控件 */}
              {pagination && (
                <div className="flex items-center justify-center space-x-4 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!pagination.has_prev || reposLoading}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    上一页
                  </Button>
                  
                  <span className="text-sm text-muted-foreground">
                    第 {currentPage} 页
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!pagination.has_next || reposLoading}
                  >
                    下一页
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
