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
      className={`group relative h-full min-h-[280px] overflow-hidden rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/30 hover:bg-white/20 hover:shadow-[0_20px_45px_-20px_rgba(15,23,42,0.45)] ${
        url ? 'cursor-pointer' : ''
      }`}
      onClick={handleClick}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-white/5" />
      </div>

      <div className="relative z-10 flex h-full flex-col p-6">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex flex-1 items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white/90">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-white transition-colors duration-300 line-clamp-1 group-hover:text-white">
                {name}
              </h3>
              <div className="mt-1 flex items-center gap-2 text-xs text-white/70">
                <span className="flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-1 text-amber-200/90">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span className="font-medium">{stars.toLocaleString()}</span>
                </span>
                <span className="text-white/50">stars</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex shrink-0 gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <button
              type="button"
              onClick={handleReanalyze}
              className="cursor-pointer rounded-full bg-blue-400/15 p-2 text-blue-200/80 transition-colors hover:bg-blue-400/25 hover:text-blue-100"
              title="重新分析"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleUnstar}
              className="cursor-pointer rounded-full bg-amber-400/15 p-2 text-amber-200/80 transition-colors hover:bg-amber-400/25 hover:text-amber-100"
              title="取消星标"
            >
              <Star className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="cursor-pointer rounded-full bg-red-400/15 p-2 text-red-200/80 transition-colors hover:bg-red-400/25 hover:text-red-100"
              title="删除仓库"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {fullName && (
          <p className="mb-2 w-full text-xs text-white/60 line-clamp-1 break-all">{fullName}</p>
        )}

        {/* Description */}
        <p
          className={`mt-2 flex-1 text-sm text-white/85 transition-colors duration-300 ${
            isTagsExpanded ? '' : 'line-clamp-3'
          }`}
        >
          {description}
        </p>

        <div className="mt-4 h-px w-full bg-white/10" />

        {/* Tags */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white/80 transition-all duration-300 hover:bg-white/25 hover:text-white"
            >
              {tag}
            </span>
          ))}
          {shouldShowExpandButton && (
            <button
              type="button"
              onClick={handleTagsToggle}
              className="cursor-pointer flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/70 transition-colors duration-200 hover:bg-white/20 hover:text-white"
            >
              {isTagsExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  收起
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
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
