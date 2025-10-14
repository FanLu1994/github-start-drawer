/**
 * GitHub API 配置管理
 */
import { GitHubConfig } from './types';

export const DEFAULT_GITHUB_CONFIG: Partial<GitHubConfig> = {
  baseURL: 'https://api.github.com',
  timeout: 10000
};

export class GitHubConfigManager {
  private static instance: GitHubConfigManager;

  private constructor() {}

  static getInstance(): GitHubConfigManager {
    if (!GitHubConfigManager.instance) {
      GitHubConfigManager.instance = new GitHubConfigManager();
    }
    return GitHubConfigManager.instance;
  }

  getConfig(): GitHubConfig | null {
    const token = this.getToken();
    if (!token) return null;
    
    return {
      token,
      baseURL: process.env.GITHUB_BASE_URL || DEFAULT_GITHUB_CONFIG.baseURL || 'https://api.github.com',
      timeout: process.env.GITHUB_TIMEOUT ? parseInt(process.env.GITHUB_TIMEOUT) : DEFAULT_GITHUB_CONFIG.timeout || 10000
    };
  }

  getToken(): string | null {
    return process.env.GITHUB_TOKEN || null;
  }

  validateConfig(): boolean {
    return !!process.env.GITHUB_TOKEN;
  }

  getHeaders(): Record<string, string> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'github-star-drawer'
    };

    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    return headers;
  }
}
