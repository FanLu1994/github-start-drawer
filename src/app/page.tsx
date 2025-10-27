"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { RepoCard } from "@/components/repo-card";
import { GitHubConfigPrompt } from "@/components/github-config-prompt";
import { Search, Github, Code, Database, Cpu, Globe, Smartphone, Zap, Shield, ChevronLeft, ChevronRight, Loader2, LucideIcon, CheckCircle, XCircle, Info, Shuffle } from "lucide-react";

interface ConfigStatus {
  configured: boolean;
  hasToken?: boolean;
  hasApiKey?: boolean;
  message: string;
}

interface GitHubRepo {
  id: string;
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
  const [repoSearchQuery, setRepoSearchQuery] = useState<string>("");
  const [githubConfig, setGithubConfig] = useState<ConfigStatus | null>(null);
  const [deepseekConfig, setDeepseekConfig] = useState<ConfigStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<ReposResponse['pagination'] | null>(null);
  const [reposLoading, setReposLoading] = useState(false);
  const [reposError, setReposError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<{
    current: number;
    total: number;
    status: string;
  } | null>(null);
  const [deletingRepos, setDeletingRepos] = useState<Set<string>>(new Set());
  const [reanalyzingRepos, setReanalyzingRepos] = useState<Set<string>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    description?: string;
  }>({
    show: false,
    type: 'info',
    title: '',
    description: ''
  });

  // 显示Toast通知
  const showToast = (type: 'success' | 'error' | 'info', title: string, description?: string) => {
    setToast({ show: true, type, title, description });
    // 3秒后自动隐藏
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

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
  const fetchRepos = async (page: number = 1, search: string = '') => {
    setReposLoading(true);
    setReposError(null);
    
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('per_page', '12');
      if (search) {
        params.append('search', search);
      }
      
      const response = await fetch(`/api/database/repos?${params.toString()}`);
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
  const fetchTags = async (random: boolean = false, search: string = '') => {
    try {
      const params = new URLSearchParams();
      if (random) {
        params.append('random', 'true');
        params.append('limit', '20');
      }
      if (search) {
        params.append('search', search);
      }
      
      const response = await fetch(`/api/database/tags?${params.toString()}`);
      if (!response.ok) {
        throw new Error('获取标签数据失败');
      }
      
      const data = await response.json();
      setAllTags(data.tags);
    } catch (error) {
      console.error('获取标签失败:', error);
    }
  };

  // 当配置检查完成后，初始化加载数据
  useEffect(() => {
    if (githubConfig?.configured && deepseekConfig?.configured && !isInitialized) {
      fetchRepos(1, ''); // 初始化时加载第一页，无搜索条件
      fetchTags(true); // 默认加载随机标签
      setIsInitialized(true);
    }
  }, [githubConfig?.configured, deepseekConfig?.configured, isInitialized]);

  // 标签搜索独立处理 - 只在用户主动搜索时触发
  // 移除了自动搜索，改为手动触发

  // 仓库搜索和分页独立处理
  useEffect(() => {
    if (isInitialized) {
      // 只有在搜索条件或页码变化时才重新获取数据
      fetchRepos(currentPage, repoSearchQuery);
    }
  }, [repoSearchQuery, currentPage, isInitialized]);

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

  // 随机获取标签
  const handleRandomTags = () => {
    fetchTags(true);
  };

  // 搜索标签
  const handleSearchTags = () => {
    if (searchQuery.trim()) {
      fetchTags(false, searchQuery);
    } else {
      // 如果搜索框为空，加载随机标签
      fetchTags(true);
    }
  };

  // 搜索仓库
  const handleSearchRepos = () => {
    setCurrentPage(1);
    fetchRepos(1, repoSearchQuery);
  };

  // 开始分析仓库
  const startAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress({ current: 0, total: 0, status: '正在获取GitHub仓库...' });
    
    try {
      const response = await fetch('/api/analysis/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('启动分析失败');
      }

      // 开始轮询进度
      const pollProgress = async () => {
        try {
          const progressResponse = await fetch('/api/analysis/progress');
          if (progressResponse.ok) {
            const state = await progressResponse.json();
            setAnalysisProgress(state.progress);
            
            if (state.progress.status === 'completed') {
              // 分析完成，刷新数据
              await fetchRepos(currentPage, repoSearchQuery);
              await fetchTags(true); // 重新加载随机标签
              setIsAnalyzing(false);
              setAnalysisProgress(null);
            } else if (state.progress.status === 'error') {
              throw new Error(state.error || '分析失败');
            } else {
              // 继续轮询
              setTimeout(pollProgress, 1000);
            }
          }
        } catch (error) {
          console.error('获取进度失败:', error);
          setIsAnalyzing(false);
          setAnalysisProgress(null);
        }
      };

      // 开始轮询
      setTimeout(pollProgress, 1000);

    } catch (error) {
      console.error('启动分析失败:', error);
      setIsAnalyzing(false);
      setAnalysisProgress(null);
    }
  };

  // 删除仓库
  const handleDeleteRepo = async (id: string, fullName: string) => {
    if (deletingRepos.has(id)) return; // 防止重复点击
    
    setDeletingRepos(prev => new Set(prev).add(id));
    
    try {
      const response = await fetch(`/api/database/repos/delete?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // 从本地状态中移除仓库
        setRepos(prev => prev.filter(repo => repo.id !== id));
        console.log(`仓库 ${fullName} 已删除`);
        showToast('success', '删除成功', `仓库 ${fullName} 已删除`);
      } else {
        const error = await response.json();
        console.error('删除仓库失败:', error);
        showToast('error', '删除失败', error.error || '未知错误');
      }
    } catch (error) {
      console.error('删除仓库失败:', error);
      showToast('error', '删除失败', '请重试');
    } finally {
      setDeletingRepos(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  // 取消星标
  const handleUnstarRepo = async (id: string, fullName: string) => {
    if (deletingRepos.has(id)) return; // 防止重复点击
    
    setDeletingRepos(prev => new Set(prev).add(id));
    
    try {
      const [owner, repo] = fullName.split('/');
      
      // 先调用 GitHub API 取消星标
      const unstarResponse = await fetch('/api/github/repos/unstar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ owner, repo })
      });

      if (!unstarResponse.ok) {
        const error = await unstarResponse.json();
        console.error('取消星标失败:', error);
        showToast('error', '取消星标失败', error.error || '未知错误');
        return;
      }

      // 然后删除本地数据库中的记录
      const deleteResponse = await fetch(`/api/database/repos/delete?id=${id}`, {
        method: 'DELETE'
      });

      if (deleteResponse.ok) {
        // 从本地状态中移除仓库
        setRepos(prev => prev.filter(repo => repo.id !== id));
        console.log(`仓库 ${fullName} 已取消星标并删除`);
        showToast('success', '取消星标成功', `仓库 ${fullName} 已取消星标并删除`);
      } else {
        const error = await deleteResponse.json();
        console.error('删除本地记录失败:', error);
        showToast('error', '部分失败', `取消星标成功，但删除本地记录失败: ${error.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('取消星标失败:', error);
      showToast('error', '取消星标失败', '请重试');
    } finally {
      setDeletingRepos(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  // 重新分析仓库
  const handleReanalyzeRepo = async (id: string, fullName: string) => {
    if (reanalyzingRepos.has(id)) return; // 防止重复点击
    
    setReanalyzingRepos(prev => new Set(prev).add(id));
    
    try {
      const response = await fetch('/api/analysis/reanalyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, fullName })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`仓库 ${fullName} 重新分析完成:`, result);
        
        // 刷新数据
        await fetchRepos(currentPage);
        await fetchTags();
        
        showToast('success', '重新分析完成', `新标签: ${result.repo.tags.join(', ')}`);
      } else {
        const error = await response.json();
        console.error('重新分析失败:', error);
        showToast('error', '重新分析失败', error.error || '未知错误');
      }
    } catch (error) {
      console.error('重新分析失败:', error);
      showToast('error', '重新分析失败', '请重试');
    } finally {
      setReanalyzingRepos(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
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
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="搜索标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchTags();
                  }
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleSearchTags}
                variant="outline" 
                size="sm"
                className="flex-1"
              >
                搜索标签
              </Button>
              <Button 
                onClick={handleRandomTags}
                variant="outline" 
                size="sm"
                className="flex-1"
              >
                <Shuffle className="h-4 w-4 mr-1" />
                随机
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {allTags.length > 0 ? (
              allTags.map((tag) => (
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
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold text-foreground">GitHub Star Drawer</h1>
              <Button 
                onClick={startAnalysis} 
                disabled={isAnalyzing}
                className="bg-primary hover:bg-primary/90"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    分析中...
                  </>
                ) : (
                  <>
                    <Cpu className="w-4 h-4 mr-2" />
                    开始分析
                  </>
                )}
              </Button>
            </div>
            <p className="text-foreground/80 mb-4">
              {repoSearchQuery 
                ? `搜索结果: "${repoSearchQuery}"`
                : selectedTags.length === 0 
                  ? "显示所有仓库" 
                  : `显示包含标签: ${selectedTags.join(", ")} 的仓库`
              }
            </p>
            
            {/* 仓库搜索框 */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="搜索仓库名称或描述..."
                  value={repoSearchQuery}
                  onChange={(e) => setRepoSearchQuery(e.target.value)}
                  className="pl-10"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchRepos();
                    }
                  }}
                />
              </div>
              <Button onClick={handleSearchRepos} variant="outline">
                搜索
              </Button>
            </div>
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
              <Button onClick={() => fetchRepos(currentPage, repoSearchQuery)} variant="outline">
                重试
              </Button>
            </div>
          ) : repos.length === 0 && !isAnalyzing ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <Github className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">还没有仓库数据</h3>
                <p className="text-muted-foreground mb-6">
                  点击下方按钮开始从GitHub获取您星标的仓库并进行AI分析
                </p>
                <Button 
                  onClick={startAnalysis} 
                  size="lg"
                  className="bg-primary hover:bg-primary/90"
                >
                  <Cpu className="w-4 h-4 mr-2" />
                  开始分析仓库
                </Button>
              </div>
            </div>
          ) : isAnalyzing ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <Loader2 className="w-16 h-16 mx-auto mb-4 text-primary animate-spin" />
                <h3 className="text-lg font-semibold mb-2">正在分析仓库</h3>
                {analysisProgress && (
                  <div className="space-y-2">
                    <p className="text-muted-foreground">{analysisProgress.status}</p>
                    {analysisProgress.total > 0 && (
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${(analysisProgress.current / analysisProgress.total) * 100}%` 
                          }}
                        />
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {analysisProgress.current} / {analysisProgress.total}
                    </p>
                  </div>
                )}
              </div>
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
                        fullName={repo.full_name}
                        onDelete={handleDeleteRepo}
                        onUnstar={handleUnstarRepo}
                        onReanalyze={handleReanalyzeRepo}
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

      {/* Toast 通知 */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <Alert variant={toast.type === 'error' ? 'destructive' : 'default'}>
            {toast.type === 'success' && <CheckCircle className="h-4 w-4" />}
            {toast.type === 'error' && <XCircle className="h-4 w-4" />}
            {toast.type === 'info' && <Info className="h-4 w-4" />}
            <AlertTitle>{toast.title}</AlertTitle>
            {toast.description && (
              <AlertDescription>{toast.description}</AlertDescription>
            )}
          </Alert>
        </div>
      )}
    </div>
  );
}
