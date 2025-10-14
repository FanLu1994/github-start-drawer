"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Github, Code, Database, Cpu, Globe, Smartphone, Zap, Shield, Palette } from "lucide-react";
import { BubbleBackground } from "@/components/animate-ui/components/backgrounds/bubble";

export default function Home() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // 图标数组
  const icons = [Github, Code, Database, Cpu, Globe, Smartphone, Zap, Shield, Palette];
  
  // 模拟repo标签数据
  const repoTags = [
    "JavaScript", "TypeScript", "React", "Vue", "Node.js", 
    "Python", "Java", "Go", "Rust", "C++", "Machine Learning", 
    "Web Development", "Mobile", "DevOps", "Database"
  ];

  // 模拟repo数据
  const repos = [
    {
      id: 1,
      name: "awesome-javascript",
      description: "A collection of awesome JavaScript libraries and resources",
      stars: 15000,
      tags: ["JavaScript", "Web Development"],
      icon: icons[0] // Github
    },
    {
      id: 2,
      name: "react-native",
      description: "A framework for building native apps with React",
      stars: 12000,
      tags: ["React", "Mobile", "JavaScript"],
      icon: icons[5] // Smartphone
    },
    {
      id: 3,
      name: "tensorflow",
      description: "An open source machine learning framework",
      stars: 180000,
      tags: ["Python", "Machine Learning"],
      icon: icons[3] // Cpu
    }
  ];

  // 根据搜索查询筛选标签
  const filteredTags = repoTags.filter(tag =>
    tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 筛选逻辑
  const filteredRepos = selectedTags.length === 0 
    ? repos 
    : repos.filter(repo => 
        selectedTags.some(tag => repo.tags.includes(tag))
      );

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <BubbleBackground 
      className="min-h-screen"
      interactive={false}
      colors={{
        first: '18,113,255',
        second: '221,74,255', 
        third: '0,220,255',
        fourth: '200,50,50',
        fifth: '180,180,50',
        sixth: '140,100,255'
      }}
    >
      <div className="flex h-screen relative z-10">
        {/* 左侧 Sidebar */}
        <div className="w-80 backdrop-blur-md bg-white/20 border-r border-white/30 p-6 overflow-y-auto">
          <h2 className="text-xl font-bold text-white mb-4">Repo 标签</h2>
          
          {/* 标签搜索器 */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="w-full justify-start"
                >
                  {tag}
                </Button>
              ))
            ) : (
              <div className="text-center py-4 text-white/70">
                <p>没有找到匹配的标签</p>
              </div>
            )}
          </div>
          
          {selectedTags.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-white/80 mb-2">已选择标签:</h3>
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer hover:bg-red-100"
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
        <div className="flex-1 p-6 overflow-y-auto backdrop-blur-sm bg-white/10">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">GitHub Star Drawer</h1>
            <p className="text-white/80">
              {selectedTags.length === 0 
                ? "显示所有仓库" 
                : `显示包含标签: ${selectedTags.join(", ")} 的仓库`
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRepos.map((repo) => (
              <Card key={repo.id} className="hover:shadow-lg transition-all duration-200 hover:scale-105 backdrop-blur-md bg-white/20 border-white/30">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <repo.icon className="h-6 w-6 text-white/80" />
                        <CardTitle className="text-lg font-semibold text-white">
                          {repo.name}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-white/70">
                        <span>⭐ {repo.stars.toLocaleString()}</span>
                        <span>•</span>
                        <span>stars</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-white/80 mb-4 line-clamp-2">
                    {repo.description}
                  </CardDescription>
                  <div className="flex flex-wrap gap-2">
                    {repo.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredRepos.length === 0 && (
            <div className="text-center py-12">
              <p className="text-white/70">没有找到匹配的仓库</p>
            </div>
          )}
        </div>
      </div>
    </BubbleBackground>
  );
}
