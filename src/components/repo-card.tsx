import { useState } from "react";
import { LucideIcon, ChevronDown, ChevronUp } from "lucide-react";

interface RepoCardProps {
  id: number;
  name: string;
  description: string;
  stars: number;
  tags: string[];
  icon: LucideIcon;
  url?: string;
}

export function RepoCard({ name, description, stars, tags, icon: Icon, url }: RepoCardProps) {
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
