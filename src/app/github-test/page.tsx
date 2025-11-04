'use client';

import { useState, useEffect } from 'react';

export default function GitHubTestPage() {
  interface GitHubRepo {
    html_url?: string;
    full_name?: string;
    stargazers_count?: number;
    description?: string;
    language?: string;
    updated_at?: string;
    forks_count?: number;
    watchers_count?: number;
    open_issues_count?: number;
  }
  const [stars, setStars] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [configMessage, setConfigMessage] = useState('');

  // 检查 GitHub 配置状态
  const checkGitHubConfig = async () => {
    try {
      const response = await fetch('/api/github/config');
      const data = await response.json();
      setIsConfigured(data.isConfigured);
      setConfigMessage(data.message || '');
    } catch (error) {
      console.error('检查 GitHub 配置失败:', error);
      setConfigMessage('检查配置失败');
    }
  };

  // 获取当前用户的 star 列表
  const fetchMyStars = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/github/stars?per_page=20');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '获取失败');
      }

      const data = await response.json();
      console.log('API返回的数据:', data); // 调试信息
      
      // 验证数据结构
      if (data.stars && Array.isArray(data.stars)) {
        setStars(data.stars);
      } else {
        console.error('数据结构异常:', data);
        setError('返回的数据格式不正确');
      }
    } catch (error) {
      console.error('获取 stars 失败:', error);
      setError(error instanceof Error ? error.message : '获取失败');
    } finally {
      setLoading(false);
    }
  };

  // 页面加载时检查配置状态
  useEffect(() => {
    checkGitHubConfig();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">GitHub API 测试</h1>
        
        {/* GitHub 配置状态 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">GitHub 配置状态</h2>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-sm font-medium ${isConfigured ? 'text-green-600' : 'text-red-600'}`}>
                  状态: {isConfigured ? '已配置' : '未配置'}
                </span>
                <button
                  onClick={checkGitHubConfig}
                  className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  刷新状态
                </button>
              </div>
              <p className="text-sm text-gray-600">
                {configMessage}
              </p>
              {!isConfigured && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>配置说明：</strong>请在项目根目录的 <code>.env.local</code> 文件中设置 <code>GITHUB_TOKEN</code> 环境变量
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 获取当前用户 Stars 区域 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">获取我的 Stars</h2>
          <div className="flex gap-4 items-end mb-4">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2">
                获取当前认证用户的 starred 仓库列表
              </p>
            </div>
            <button
              onClick={fetchMyStars}
              disabled={!isConfigured || loading}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? '获取中...' : '获取我的 Stars'}
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {stars.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Star 列表 ({stars.length})</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {stars.map((repo, index) => {
                  // 验证数据结构 - 现在直接是仓库对象
                  if (!repo || !repo.html_url) {
                    console.warn('无效的仓库数据:', repo);
                    return (
                      <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                        <p className="text-red-600 text-sm">数据格式错误</p>
                      </div>
                    );
                  }

                  return (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-lg text-blue-600 hover:text-blue-800">
                          <a 
                            href={repo.html_url || '#'} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {repo.full_name || 'Unknown Repository'}
                          </a>
                        </h4>
                        <span className="text-sm text-gray-500">
                          ⭐ {repo.stargazers_count || 0}
                        </span>
                      </div>
                      
                      {repo.description && (
                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                          {repo.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{repo.language || 'Unknown'}</span>
                        <span>{repo.updated_at ? new Date(repo.updated_at).toLocaleDateString() : 'Unknown'}</span>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>🍴 {repo.forks_count || 0}</span>
                        <span>👁️ {repo.watchers_count || 0}</span>
                        <span>🐛 {repo.open_issues_count || 0}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* API 使用说明 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">API 使用说明</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>获取当前用户 Stars:</strong> GET /api/github/stars?per_page=20&page=1&sort=created&direction=desc</p>
            <p><strong>获取仓库信息:</strong> GET /api/github/repo?owner=用户名&repo=仓库名</p>
            <p><strong>获取仓库内容:</strong> GET /api/github/repo/contents?owner=用户名&repo=仓库名&path=路径</p>
            <p><strong>获取仓库树:</strong> GET /api/github/repo/tree?owner=用户名&repo=仓库名&sha=分支</p>
            <p><strong>获取文件内容:</strong> GET /api/github/repo/file?owner=用户名&repo=仓库名&path=文件路径</p>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">
                <strong>注意：</strong>所有API都需要在环境变量中配置 <code>GITHUB_TOKEN</code> 才能正常工作
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
