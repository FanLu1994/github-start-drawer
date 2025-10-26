import { AlertTriangle, Github, Settings, Brain, Key } from "lucide-react";
import { Alert } from "@/components/ui/alert";

interface ConfigPromptProps {
  className?: string;
}

export function GitHubConfigPrompt({ className }: ConfigPromptProps) {
  return (
    <div className={`flex items-center justify-center min-h-screen bg-background ${className}`}>
      <div className="max-w-md mx-auto p-6">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">GitHub Star Drawer</h1>
          <p className="text-muted-foreground">需要配置 API 密钥才能使用</p>
        </div>

        <div className="space-y-4 mb-6">
          <Alert>
            <Github className="h-4 w-4" />
            <div>
              <h3 className="font-medium">GitHub API 配置</h3>
              <p className="text-sm text-muted-foreground mt-1">
                请设置 GITHUB_TOKEN 环境变量以访问 GitHub API
              </p>
            </div>
          </Alert>

          <Alert>
            <Brain className="h-4 w-4" />
            <div>
              <h3 className="font-medium">DeepSeek API 配置</h3>
              <p className="text-sm text-muted-foreground mt-1">
                请设置 DEEPSEEK_API_KEY 环境变量以使用 AI 功能
              </p>
            </div>
          </Alert>
        </div>

        <div className="space-y-4">
          <div className="bg-card border rounded-lg p-4">
            <h3 className="font-medium text-card-foreground mb-2 flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              配置步骤
            </h3>
            <ol className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start">
                <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">1</span>
                在 GitHub 上创建 Personal Access Token
              </li>
              <li className="flex items-start">
                <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">2</span>
                在 DeepSeek 平台获取 API Key
              </li>
              <li className="flex items-start">
                <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">3</span>
                在项目根目录创建 .env.local 文件
              </li>
              <li className="flex items-start">
                <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">4</span>
                添加环境变量配置
              </li>
              <li className="flex items-start">
                <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">5</span>
                重启开发服务器
              </li>
            </ol>
          </div>

          <div className="bg-muted/50 border rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">示例配置</h4>
            <code className="text-xs bg-background border rounded p-2 block text-muted-foreground">
              GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx<br/>
              DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
            </code>
          </div>

          <div className="flex justify-center space-x-4">
            <a 
              href="https://github.com/settings/tokens" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <Github className="w-4 h-4 mr-1" />
              创建 GitHub Token
            </a>
            <a 
              href="https://platform.deepseek.com/api_keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <Key className="w-4 h-4 mr-1" />
              获取 DeepSeek API Key
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
