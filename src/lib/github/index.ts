/**
 * GitHub API 模块入口文件
 */
export { GitHubClient } from './client';
export { GitHubConfigManager, DEFAULT_GITHUB_CONFIG } from './config';
export type {
  GitHubRepo,
  GitHubStar,
  GitHubFile,
  GitHubTreeItem,
  GitHubError,
  GitHubConfig,
  StarListOptions,
  RepoContentOptions
} from './types';

// 默认导出
export { GitHubClient as default } from './client';
