import { useState } from "react";
import { LucideIcon, ChevronDown, ChevronUp, Trash2, Star, RefreshCw } from "lucide-react";

interface RepoCardProps {
  id: string;
  name: string;
  description: string;
  stars: number;
  tags: string[];
  icon: LucideIcon;
  url?: string;
  fullName?: string;
  onDelete?: (id: string, fullName: string) => void;
  onUnstar?: (id: string, fullName: string) => void;
  onReanalyze?: (id: string, fullName: string) => void;
}

export function RepoCard({ 
  id, 
  name, 
  description, 
  stars, 
  tags, 
  icon: Icon, 
  url, 
  fullName,
  onDelete,
  onUnstar,
  onReanalyze
}: RepoCardProps) {
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);
  const maxVisibleTags = 3; // 默认显示3个标签

  const handleClick = () => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleTagsToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发卡片点击
    setIsTagsExpanded(!isTagsExpanded);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && fullName) {
      onDelete(id, fullName);
    }
  };

  const handleUnstar = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUnstar && fullName) {
      onUnstar(id, fullName);
    }
  };

  const handleReanalyze = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onReanalyze && fullName) {
      onReanalyze(id, fullName);
    }
  };

  const visibleTags = isTagsExpanded ? tags : tags.slice(0, maxVisibleTags);
  const hasMoreTags = tags.length > maxVisibleTags;
  const hasLongDescription = description.length > 100; // 如果描述超过100个字符，认为需要展开
  const shouldShowExpandButton = hasMoreTags || hasLongDescription;

  return (
    <div 
      className={`group relative overflow-hidden rounded-lg border border-white/20 bg-white/20 backdrop-blur-md transition-all duration-300 hover:bg-white/30 hover:scale-105 hover:shadow-2xl h-full min-h-[280px] ${
        url ? 'cursor-pointer' : ''
      }`}
      onClick={handleClick}
    >
      <div className="p-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <Icon className="h-6 w-6 text-white/80 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white truncate">
              {name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-white/70 mt-1">
              <span>⭐ {stars.toLocaleString()}</span>
              <span>•</span>
              <span>stars</span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleReanalyze}
              className="p-2 rounded-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 transition-colors"
              title="重新分析"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleUnstar}
              className="p-2 rounded-full bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 hover:text-yellow-300 transition-colors"
              title="取消星标"
            >
              <Star className="w-4 h-4 fill-current" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-colors"
              title="删除仓库"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Description */}
        <p className={`text-white/80 text-sm mb-4 flex-1 ${
          isTagsExpanded ? '' : 'line-clamp-2'
        }`}>
          {description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-auto">
          {visibleTags.map((tag) => (
            <span 
              key={tag}
              className="px-2 py-1 text-xs bg-white/20 text-white/90 rounded-full border border-white/30 backdrop-blur-sm hover:bg-white/30 transition-colors"
            >
              {tag}
            </span>
          ))}
          {shouldShowExpandButton && (
            <button
              onClick={handleTagsToggle}
              className="px-2 py-1 text-xs bg-white/10 text-white/70 rounded-full border border-white/20 backdrop-blur-sm hover:bg-white/20 transition-colors flex items-center gap-1"
            >
              {isTagsExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  收起
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  {hasMoreTags ? `+${tags.length - maxVisibleTags}` : '展开'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
