/**
 * GitHub API 类型定义
 */

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  owner: {
    id: number;
    login: string;
    avatar_url: string;
    html_url: string;
  };
  topics: string[];
  license: {
    name: string;
    spdx_id: string;
  } | null;
  default_branch: string;
  size: number;
  archived: boolean;
  disabled: boolean;
  private: boolean;
  fork: boolean;
}

export interface GitHubStar {
  starred_at: string;
  repo: GitHubRepo;
}

export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: 'file' | 'dir';
  content?: string;
  encoding?: string;
}

export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  size?: number;
  url: string;
}

export interface GitHubConfig {
  token: string;
  baseURL?: string;
  timeout?: number;
}

export interface GitHubError {
  message: string;
  documentation_url?: string;
  status?: number;
}

export interface StarListOptions {
  per_page?: number;
  page?: number;
  sort?: 'created' | 'updated';
  direction?: 'asc' | 'desc';
}

export interface RepoContentOptions {
  ref?: string; // 分支或标签名
  recursive?: boolean; // 是否递归获取目录内容
}
