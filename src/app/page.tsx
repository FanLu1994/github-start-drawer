"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { RepoCard } from "@/components/repo-card";
import { GitHubConfigPrompt } from "@/components/github-config-prompt";
import { CustomTagManager } from "@/components/custom-tag-manager";
import { Search, Github, Code, Database, Cpu, Globe, Smartphone, Zap, Shield, ChevronLeft, ChevronRight, Loader2, LucideIcon, CheckCircle, XCircle, Info, RefreshCw, Settings, Square, Check } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  aiDescription: string | null;
  stargazers_count: number;
  language: string | null;
  topics: string[];
  aiTags: string[];
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

interface CustomTagWithCount {
  id: string;
  content: string;
  count: number;
}

interface RepoStats {
  totalRepos: number;
  analyzedRepos: number;
  unanalyzedRepos: number;
}

export default function Home() {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [repoSearchQuery, setRepoSearchQuery] = useState<string>("");
  const [activeSearchQuery, setActiveSearchQuery] = useState<string>("");
  const [githubConfig, setGithubConfig] = useState<ConfigStatus | null>(null);
  const [deepseekConfig, setDeepseekConfig] = useState<ConfigStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [allTags, setAllTags] = useState<CustomTagWithCount[]>([]);
  const [repoStats, setRepoStats] = useState<RepoStats | null>(null);
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{
    current: number;
    total: number;
    status: string;
    synced: number;
    skipped: number;
    errors: number;
  } | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [customTagManagerOpen, setCustomTagManagerOpen] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(true); // false: 显示原始GitHub信息, true: 显示AI分析信息
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [pendingAction, setPendingAction] = useState<'sync' | 'analyze' | null>(null);
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
  const fetchRepos = async (page: number = 1, search: string = '', tag: string | null = null) => {
    setReposLoading(true);
    setReposError(null);
    
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('per_page', '12');
      if (search) {
        params.append('search', search);
      }
      if (tag) {
        params.append('tags', tag);
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

  // 获取自定义标签及其关联的仓库数量
  const fetchTags = async () => {
    try {
      const response = await fetch('/api/database/custom-tags/stats');
      if (!response.ok) {
        throw new Error('获取标签数据失败');
      }
      
      const data = await response.json();
      setAllTags(data.tags || []);
    } catch (error) {
      console.error('获取标签失败:', error);
    }
  };

  // 获取统计信息
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/database/stats');
      if (!response.ok) {
        throw new Error('获取统计信息失败');
      }
      
      const data = await response.json();
      setRepoStats(data);
    } catch (error) {
      console.error('获取统计信息失败:', error);
    }
  };

  // 当配置检查完成后，初始化加载数据
  useEffect(() => {
    if (githubConfig?.configured && deepseekConfig?.configured && !isInitialized) {
      fetchRepos(1, '', null); // 初始化时加载第一页，无搜索条件，无标签筛选
      fetchTags(); // 加载自定义标签
      fetchStats(); // 加载统计信息
      setIsInitialized(true);
    }
  }, [githubConfig?.configured, deepseekConfig?.configured, isInitialized]);

  // 标签搜索独立处理 - 只在用户主动搜索时触发
  // 移除了自动搜索，改为手动触发

  // 仓库搜索和分页独立处理
  useEffect(() => {
    if (isInitialized) {
      // 只有在页码、激活的搜索条件或选中的标签变化时才重新获取数据
      fetchRepos(currentPage, activeSearchQuery, selectedTag);
    }
  }, [activeSearchQuery, currentPage, selectedTag, isInitialized]);

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

  // 标签选择逻辑（单选）
  const selectTag = (tag: string) => {
    if (selectedTag === tag) {
      // 如果点击的是已选中的标签，则取消选择
      setSelectedTag(null);
      setCurrentPage(1);
      fetchRepos(1, activeSearchQuery, null);
    } else {
      // 选择新标签
      setSelectedTag(tag);
      setCurrentPage(1);
      fetchRepos(1, activeSearchQuery, tag);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchRepos(newPage, activeSearchQuery, selectedTag);
  };


  // 搜索仓库
  const handleSearchRepos = () => {
    setCurrentPage(1);
    setActiveSearchQuery(repoSearchQuery);
    // 搜索时会自动触发 useEffect，这里不需要手动调用
  };

  // 停止分析
  const stopAnalysis = async () => {
    try {
      const response = await fetch('/api/analysis/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('停止分析失败');
      }

      setIsAnalyzing(false);
      setAnalysisProgress(null);
      showToast('info', '分析已停止', '已停止当前分析任务');
    } catch (error) {
      console.error('停止分析失败:', error);
      showToast('error', '停止失败', error instanceof Error ? error.message : '请重试');
    }
  };

  // 开始分析仓库
  const startAnalysis = async () => {
    setPendingAction('analyze');
    setPasswordDialogOpen(true);
  };

  // 执行分析操作
  const executeAnalysis = async (password: string) => {
    setIsAnalyzing(true);
    setAnalysisProgress({ current: 0, total: 0, status: '正在获取GitHub仓库...' });
    
    try {
      const response = await fetch('/api/analysis/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          const errorBody = await response.json().catch(() => ({}));
          if (errorBody.error === '密码错误') {
            showToast('error', '密码错误', '请重新输入正确的密码');
            setIsAnalyzing(false);
            setAnalysisProgress(null);
            return;
          }
        }
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
              await fetchRepos(currentPage, activeSearchQuery, selectedTag);
              await fetchTags(); // 重新加载自定义标签
              await fetchStats(); // 刷新统计信息
              setIsAnalyzing(false);
              setAnalysisProgress(null);
            } else if (state.progress.status === '已停止') {
              // 分析已停止
              setIsAnalyzing(false);
              setAnalysisProgress(null);
              showToast('info', '分析已停止', '您可以随时重新开始分析');
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
        await fetchStats(); // 刷新统计信息
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
        await fetchRepos(currentPage, activeSearchQuery, selectedTag);
        await fetchTags();
        await fetchStats(); // 刷新统计信息
        
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

  // 同步 GitHub Star 的仓库
  const handleSync = async () => {
    setPendingAction('sync');
    setPasswordDialogOpen(true);
  };

  // 执行同步操作
  const executeSync = async (password: string) => {
    setIsSyncing(true);
    setSyncProgress({ current: 0, total: 0, status: '正在启动同步...', synced: 0, skipped: 0, errors: 0 });
    
    try {
      const response = await fetch('/api/github/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          const errorBody = await response.json().catch(() => ({}));
          if (errorBody.error === '密码错误') {
            showToast('error', '密码错误', '请重新输入正确的密码');
            setIsSyncing(false);
            setSyncProgress(null);
            return;
          }
          const code = (errorBody && errorBody.code) || 'UNAUTHORIZED';
          const details = errorBody && (errorBody.details || errorBody.error);
          showToast('error', code === 'GITHUB_TOKEN_MISSING' ? 'GitHub Token 未配置' : 'GitHub Token 无效', details);
          setIsSyncing(false);
          setSyncProgress(null);
          return;
        }
        const error = await response.json();
        throw new Error(error.error || '启动同步失败');
      }

      // 开始轮询进度
      const pollProgress = async () => {
        try {
          const progressResponse = await fetch('/api/github/sync');
          if (progressResponse.status === 401) {
            const errorBody = await progressResponse.json().catch(() => ({}));
            const code = (errorBody && errorBody.code) || 'UNAUTHORIZED';
            const details = errorBody && (errorBody.details || errorBody.error);
            showToast('error', code === 'GITHUB_TOKEN_MISSING' ? 'GitHub Token 未配置' : 'GitHub Token 无效', details);
            setIsSyncing(false);
            setSyncProgress(null);
            return;
          }
          if (progressResponse.ok) {
            const state = await progressResponse.json();
            setSyncProgress(state.progress);
            
            if (state.progress.status === 'completed') {
              // 同步完成，刷新数据
              await fetchRepos(currentPage, activeSearchQuery, selectedTag);
              await fetchStats(); // 刷新统计信息
              setIsSyncing(false);
              setSyncProgress(null);
              
              showToast(
                'success', 
                '同步完成', 
                `已同步 ${state.progress.synced} 个仓库，跳过 ${state.progress.skipped} 个已存在的仓库`
              );
            } else if (state.progress.status === 'error') {
              throw new Error(state.error || '同步失败');
            } else if (state.isRunning) {
              // 继续轮询
              setTimeout(pollProgress, 1000);
            } else {
              setIsSyncing(false);
              setSyncProgress(null);
            }
          }
        } catch (error) {
          console.error('获取同步进度失败:', error);
          setIsSyncing(false);
          setSyncProgress(null);
          showToast('error', '同步失败', error instanceof Error ? error.message : '未知错误');
        }
      };

      // 开始轮询
      setTimeout(pollProgress, 1000);

    } catch (error) {
      console.error('同步失败:', error);
      setIsSyncing(false);
      setSyncProgress(null);
      showToast('error', '同步失败', error instanceof Error ? error.message : '请重试');
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-card-foreground">Repo 标签</h2>
            <Button
              onClick={() => setCustomTagManagerOpen(true)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="管理自定义标签"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          
          {/* 统计信息 */}
          <div className="mb-6 space-y-3">
            <div className="rounded-lg border bg-card/50 p-4 backdrop-blur-sm">
              <div className="text-sm text-muted-foreground mb-1">仓库总数</div>
              <div className="text-2xl font-bold text-card-foreground">
                {repoStats?.totalRepos ?? '-'}
              </div>
            </div>
            <div className="rounded-lg border bg-card/50 p-4 backdrop-blur-sm">
              <div className="text-sm text-muted-foreground mb-1">已分析仓库</div>
              <div className="text-2xl font-bold text-primary">
                {repoStats?.analyzedRepos ?? '-'}
              </div>
              {repoStats && repoStats.totalRepos > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  {Math.round((repoStats.analyzedRepos / repoStats.totalRepos) * 100)}% 完成
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {allTags.length > 0 ? (
              allTags.map((tag) => {
                const isActive = selectedTag === tag.content;
                return (
                  <Button
                    key={tag.id}
                    onClick={() => selectTag(tag.content)}
                    variant="outline"
                    className={`w-full justify-between items-center rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-primary/25 border-primary/60 text-card-foreground shadow-lg ring-2 ring-primary/40"
                        : "bg-card/20 border-border text-card-foreground hover:bg-primary/15 hover:border-primary/30 backdrop-blur-sm"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isActive && <Check className="h-4 w-4" />}
                      <span className="truncate">{tag.content}</span>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`ml-2 ${isActive ? "bg-primary/80 text-primary-foreground" : ""}`}
                    >
                      {tag.count}
                    </Badge>
                  </Button>
                );
              })
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p>暂无自定义标签</p>
              </div>
            )}
          </div>
        </div>

        {/* 右侧主内容区 */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold text-foreground">GitHub Star Drawer</h1>
              <div className="flex gap-2">
                <Button 
                  onClick={handleSync} 
                  disabled={isSyncing}
                  variant="outline"
                  title="同步 GitHub Star 的仓库"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      同步中...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      同步
                    </>
                  )}
                </Button>
                {isAnalyzing ? (
                  <Button 
                    onClick={stopAnalysis}
                    variant="destructive"
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    停止分析
                  </Button>
                ) : (
                  <Button 
                    onClick={startAnalysis}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Cpu className="w-4 h-4 mr-2" />
                    开始分析
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-foreground/80">
                {activeSearchQuery 
                  ? `搜索结果: "${activeSearchQuery}"`
                  : selectedTag 
                    ? `显示标签 "${selectedTag}" 的仓库`
                    : "显示所有仓库"
                }
              </p>
              <div className="flex items-center gap-2">
                <label htmlFor="ai-analysis-switch" className="text-sm text-foreground/80 cursor-pointer">
                  显示AI分析
                </label>
                <Switch
                  id="ai-analysis-switch"
                  checked={showAIAnalysis}
                  onCheckedChange={(checked) => {
                    setShowAIAnalysis(checked);
                  }}
                />
              </div>
            </div>
            
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
              <Button onClick={() => fetchRepos(currentPage, activeSearchQuery, selectedTag)} variant="outline">
                重试
              </Button>
            </div>
          ) : repos.length === 0 && !isAnalyzing && !isSyncing ? (
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
          ) : isSyncing ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <Loader2 className="w-16 h-16 mx-auto mb-4 text-primary animate-spin" />
                <h3 className="text-lg font-semibold mb-2">正在同步仓库</h3>
                {syncProgress && (
                  <div className="space-y-2">
                    <p className="text-muted-foreground">{syncProgress.status}</p>
                    {syncProgress.total > 0 && (
                      <>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${(syncProgress.current / syncProgress.total) * 100}%` 
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>{syncProgress.current} / {syncProgress.total}</span>
                          <span>
                            已同步: {syncProgress.synced} | 跳过: {syncProgress.skipped}
                            {syncProgress.errors > 0 && ` | 错误: ${syncProgress.errors}`}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}
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
                {repos.map((repo) => {
                  const IconComponent = getIconForLanguage(repo.language);
                  
                  // 根据开关状态选择显示的内容
                  let displayDescription: string;
                  let displayTags: string[];
                  
                  if (showAIAnalysis) {
                    // 显示 AI 分析信息，如果没有则显示为空
                    displayDescription = repo.aiDescription || '';
                    displayTags = repo.aiTags && repo.aiTags.length > 0 ? repo.aiTags : [];
                  } else {
                    // 显示原始 GitHub 信息
                    displayDescription = repo.description || '暂无描述';
                    const repoLanguages = repo.language ? [repo.language] : [];
                    displayTags = [...repoLanguages, ...(repo.topics || [])];
                  }
                  
                  return (
                    <div key={repo.id} className="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] min-w-[320px]">
                      <RepoCard
                        id={repo.id}
                        name={repo.name}
                        description={displayDescription}
                        stars={repo.stargazers_count}
                        tags={displayTags}
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

              {repos.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-foreground/70">
                    {selectedTag ? `没有找到包含标签 "${selectedTag}" 的仓库` : '没有仓库数据'}
                  </p>
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

      {/* 自定义标签管理弹窗 */}
      <CustomTagManager
        open={customTagManagerOpen}
        onOpenChange={setCustomTagManagerOpen}
        onTagsChange={() => {
          // 标签变化时重新加载标签列表
          fetchTags();
        }}
      />

      {/* 密码输入对话框 */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>输入操作密码</DialogTitle>
            <DialogDescription>
              {pendingAction === 'sync' ? '同步操作需要密码验证' : '分析操作需要密码验证'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  if (pendingAction === 'sync') {
                    executeSync(password);
                  } else if (pendingAction === 'analyze') {
                    executeAnalysis(password);
                  }
                  setPasswordDialogOpen(false);
                  setPassword("");
                  setPendingAction(null);
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPasswordDialogOpen(false);
                setPassword("");
                setPendingAction(null);
              }}
            >
              取消
            </Button>
            <Button
              onClick={() => {
                if (pendingAction === 'sync') {
                  executeSync(password);
                } else if (pendingAction === 'analyze') {
                  executeAnalysis(password);
                }
                setPasswordDialogOpen(false);
                setPassword("");
                setPendingAction(null);
              }}
            >
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
