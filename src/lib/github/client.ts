/**
 * GitHub API 客户端
 */
import { GitHubConfigManager } from './config';
import { 
  GitHubRepo, 
  GitHubStar, 
  GitHubFile, 
  GitHubTreeItem,
  GitHubError,
  StarListOptions,
  RepoContentOptions,
  GitHubConfig
} from './types';

export class GitHubClient {
  private configManager: GitHubConfigManager;
  private baseURL: string;

  constructor(config?: GitHubConfig) {
    this.configManager = GitHubConfigManager.getInstance();
    
    if (config) {
      this.configManager.setConfig(config);
    }

    this.baseURL = this.configManager.getConfig()?.baseURL || 'https://api.github.com';
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.configManager.getToken();
    
    if (!token) {
      const err = new Error('GITHUB_TOKEN_MISSING');
      // 为路由层识别，附加一个标记属性
      // @ts-expect-error augment error
      err.code = 'GITHUB_TOKEN_MISSING';
      throw err;
    }

    const url = `${this.baseURL}${endpoint}`;
    const headers = this.configManager.getHeaders();

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData: GitHubError = await response.json().catch(() => ({
          message: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status
        }));

        if (response.status === 401) {
          const err = new Error('GITHUB_TOKEN_INVALID');
          // @ts-expect-error augment error
          err.code = 'GITHUB_TOKEN_INVALID';
          // @ts-expect-error augment error
          err.details = errorData?.message;
          throw err;
        }

        const err = new Error(`GitHub API 错误: ${errorData.message}`);
        // @ts-expect-error augment error
        err.code = 'GITHUB_API_ERROR';
        // @ts-expect-error augment error
        err.status = response.status;
        throw err;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`网络请求失败: ${error}`);
    }
  }

  /**
   * 获取用户的 star 列表
   */
  async getStarredRepos(
    username: string, 
    options: StarListOptions = {}
  ): Promise<GitHubStar[]> {
    const {
      per_page = 30,
      page = 1,
      sort = 'created',
      direction = 'desc'
    } = options;

    const params = new URLSearchParams({
      per_page: per_page.toString(),
      page: page.toString(),
      sort,
      direction
    });

    const endpoint = `/users/${username}/starred?${params}`;
    return this.request<GitHubStar[]>(endpoint);
  }

  /**
   * 获取当前认证用户的 star 列表
   */
  async getMyStarredRepos(options: StarListOptions = {}): Promise<GitHubRepo[]> {
    const {
      per_page = 30,
      page = 1,
      sort = 'created',
      direction = 'desc'
    } = options;

    const params = new URLSearchParams({
      per_page: per_page.toString(),
      page: page.toString(),
      sort,
      direction
    });

    const endpoint = `/user/starred?${params}`;
    return this.request<GitHubRepo[]>(endpoint);
  }

  /**
   * 获取当前认证用户的所有 star 列表（分页获取全部）
   */
  async getAllStarredRepos(): Promise<GitHubRepo[]> {
    const allRepos: GitHubRepo[] = [];
    let page = 1;
    const perPage = 100; // 每页最大数量
    let hasMore = true;

    while (hasMore) {
      try {
        const repos = await this.getMyStarredRepos({
          per_page: perPage,
          page,
          sort: 'created',
          direction: 'desc'
        });

        if (repos.length === 0) {
          hasMore = false;
        } else {
          allRepos.push(...repos);
          page++;
          
          // 如果返回的数量少于每页数量，说明已经是最后一页
          if (repos.length < perPage) {
            hasMore = false;
          }
        }
      } catch (error) {
        console.error(`获取第 ${page} 页星标仓库失败:`, error);
        hasMore = false;
      }
    }

    return allRepos;
  }

  /**
   * 获取仓库信息
   */
  async getRepo(owner: string, repo: string): Promise<GitHubRepo> {
    const endpoint = `/repos/${owner}/${repo}`;
    return this.request<GitHubRepo>(endpoint);
  }

  /**
   * 获取仓库内容列表
   */
  async getRepoContents(
    owner: string, 
    repo: string, 
    path: string = '', 
    options: RepoContentOptions = {}
  ): Promise<GitHubFile[]> {
    const { ref, recursive } = options;
    const params = new URLSearchParams();
    
    if (ref) params.append('ref', ref);
    if (recursive) params.append('recursive', '1');

    const queryString = params.toString();
    const endpoint = `/repos/${owner}/${repo}/contents/${path}${queryString ? `?${queryString}` : ''}`;
    
    return this.request<GitHubFile[]>(endpoint);
  }

  /**
   * 获取仓库的目录树
   */
  async getRepoTree(
    owner: string, 
    repo: string, 
    sha: string = 'HEAD',
    recursive: boolean = false
  ): Promise<GitHubTreeItem[]> {
    const params = new URLSearchParams();
    if (recursive) params.append('recursive', '1');

    const queryString = params.toString();
    const endpoint = `/repos/${owner}/${repo}/git/trees/${sha}${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.request<{ tree: GitHubTreeItem[] }>(endpoint);
    return response.tree;
  }

  /**
   * 获取文件内容
   */
  async getFileContent(
    owner: string, 
    repo: string, 
    path: string,
    ref?: string
  ): Promise<GitHubFile> {
    const params = new URLSearchParams();
    if (ref) params.append('ref', ref);

    const queryString = params.toString();
    const endpoint = `/repos/${owner}/${repo}/contents/${path}${queryString ? `?${queryString}` : ''}`;
    
    return this.request<GitHubFile>(endpoint);
  }

  /**
   * 获取仓库的所有分支
   */
  async getRepoBranches(owner: string, repo: string): Promise<Array<{ name: string; commit: { sha: string } }>> {
    const endpoint = `/repos/${owner}/${repo}/branches`;
    return this.request<Array<{ name: string; commit: { sha: string } }>>(endpoint);
  }

  /**
   * 获取仓库的所有标签
   */
  async getRepoTags(owner: string, repo: string): Promise<Array<{ name: string; commit: { sha: string } }>> {
    const endpoint = `/repos/${owner}/${repo}/tags`;
    return this.request<Array<{ name: string; commit: { sha: string } }>>(endpoint);
  }

  /**
   * 搜索仓库
   */
  async searchRepos(
    query: string, 
    options: {
      sort?: 'stars' | 'forks' | 'help-wanted-issues' | 'updated';
      order?: 'asc' | 'desc';
      per_page?: number;
      page?: number;
    } = {}
  ): Promise<{ total_count: number; items: GitHubRepo[] }> {
    const {
      sort = 'stars',
      order = 'desc',
      per_page = 30,
      page = 1
    } = options;

    const params = new URLSearchParams({
      q: query,
      sort,
      order,
      per_page: per_page.toString(),
      page: page.toString()
    });

    const endpoint = `/search/repositories?${params}`;
    return this.request<{ total_count: number; items: GitHubRepo[] }>(endpoint);
  }

  /**
   * 检查配置是否有效
   */
  isConfigured(): boolean {
    return this.configManager.validateConfig();
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<GitHubConfig>): void {
    const currentConfig = this.configManager.getConfig();
    if (currentConfig) {
      this.configManager.setConfig({ ...currentConfig, ...config });
    }
  }
}
