"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Plus, Pencil, Trash2, X, Loader2, Search } from "lucide-react";

interface CustomTag {
  id: string;
  content: string;
}

interface CustomTagManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTagsChange?: () => void;
}

export function CustomTagManager({ open, onOpenChange, onTagsChange }: CustomTagManagerProps) {
  const [tags, setTags] = useState<CustomTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingTag, setEditingTag] = useState<CustomTag | null>(null);
  const [newTagContent, setNewTagContent] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 加载标签
  const loadTags = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/database/custom-tags');
      if (!response.ok) throw new Error('加载标签失败');
      const data = await response.json();
      setTags(data.tags || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  // 创建标签
  const handleCreate = async () => {
    if (!newTagContent.trim()) {
      setError('标签内容不能为空');
      return;
    }

    try {
      setError('');
      setIsCreating(true);
      const response = await fetch('/api/database/custom-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newTagContent.trim() })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '创建失败');
      }

      setNewTagContent('');
      await loadTags();
      onTagsChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setIsCreating(false);
    }
  };

  // 更新标签
  const handleUpdate = async () => {
    if (!editingTag || !editingTag.content.trim()) {
      setError('标签内容不能为空');
      return;
    }

    try {
      setError('');
      setUpdatingId(editingTag.id);
      const response = await fetch('/api/database/custom-tags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingTag.id, content: editingTag.content.trim() })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '更新失败');
      }

      setEditingTag(null);
      await loadTags();
      onTagsChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败');
    } finally {
      setUpdatingId(null);
    }
  };

  // 删除标签
  const confirmDelete = async (id: string) => {
    try {
      setError('');
      setDeletingId(id);
      const response = await fetch(`/api/database/custom-tags?id=${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '删除失败');
      }

      await loadTags();
      onTagsChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    } finally {
      setDeletingId(null);
      setDeleteConfirmationId(null);
    }
  };

  // 弹窗打开时加载标签
  useEffect(() => {
    if (open) {
      loadTags();
    }
  }, [open]);

  const filteredTags = useMemo(() => {
    if (!filter.trim()) return tags;
    const query = filter.trim().toLowerCase();
    return tags.filter(tag => tag.content.toLowerCase().includes(query));
  }, [tags, filter]);

  const totalTags = tags.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>自定义标签管理</DialogTitle>
          <DialogDescription>
            创建、编辑和删除您的自定义标签
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-card-foreground">标签概览</p>
              <p className="text-xs text-muted-foreground">
                当前共有 <span className="font-semibold text-card-foreground">{totalTags}</span> 个自定义标签
              </p>
            </div>

            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="过滤标签..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="pl-9 w-44"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-card-foreground">创建新标签</p>
              {error && (
                <div className="flex items-center gap-2 text-xs text-destructive">
                  <X className="h-3 w-3" />
                  <span>{error}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="输入新标签内容..."
                value={newTagContent}
                onChange={(e) => setNewTagContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreate();
                  }
                }}
                disabled={isCreating}
              />
              <Button onClick={handleCreate} size="sm" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    添加中
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-1" />
                    添加
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* 标签列表 */}
        <div className="flex-1 overflow-y-auto border rounded-lg p-4 space-y-3 bg-card/30">
          {loading ? (
            <p className="text-center text-muted-foreground">加载中...</p>
          ) : filteredTags.length === 0 ? (
            <p className="text-center text-muted-foreground">暂无自定义标签</p>
          ) : (
            filteredTags.map((tag) => {
              const isEditing = editingTag?.id === tag.id;
              const isUpdating = updatingId === tag.id;
              const isDeleting = deletingId === tag.id;
              const isConfirmingDelete = deleteConfirmationId === tag.id;

              return (
                <div
                  key={tag.id}
                  className="flex items-center justify-between gap-3 rounded-lg border bg-background/60 p-3 transition-all hover:border-primary/40"
                >
                  {isEditing ? (
                    <div className="flex-1 flex flex-wrap items-center gap-2">
                      <Input
                        value={editingTag.content}
                        onChange={(e) => setEditingTag({ ...editingTag, content: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleUpdate();
                          } else if (e.key === 'Escape') {
                            setEditingTag(null);
                          }
                        }}
                        autoFocus
                        disabled={isUpdating}
                      />
                      <Button
                        onClick={handleUpdate}
                        size="sm"
                        variant="outline"
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "保存"
                        )}
                      </Button>
                      <Button onClick={() => setEditingTag(null)} size="sm" variant="ghost">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={isConfirmingDelete ? "destructive" : "secondary"}
                          className={cn(
                            "text-sm px-2.5 py-1",
                            isConfirmingDelete && "bg-destructive text-destructive-foreground"
                          )}
                        >
                          {tag.content}
                        </Badge>
                        {isUpdating && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                      </div>
                      <div className="flex gap-1">
                        {!isConfirmingDelete ? (
                          <>
                            <Button
                              onClick={() => setEditingTag(tag)}
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => setDeleteConfirmationId(tag.id)}
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Button
                              onClick={() => confirmDelete(tag.id)}
                              size="sm"
                              variant="destructive"
                              disabled={isDeleting}
                            >
                              {isDeleting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "确认"
                              )}
                            </Button>
                            <Button
                              onClick={() => setDeleteConfirmationId(null)}
                              size="sm"
                              variant="ghost"
                            >
                              取消
                            </Button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


