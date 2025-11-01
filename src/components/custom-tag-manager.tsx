"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, X } from "lucide-react";

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
    }
  };

  // 删除标签
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个标签吗？')) return;

    try {
      setError('');
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
    }
  };

  // 弹窗打开时加载标签
  useEffect(() => {
    if (open) {
      loadTags();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>自定义标签管理</DialogTitle>
          <DialogDescription>
            创建、编辑和删除您的自定义标签
          </DialogDescription>
        </DialogHeader>

        {/* 创建新标签 */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="输入新标签内容..."
              value={newTagContent}
              onChange={(e) => setNewTagContent(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCreate();
                }
              }}
            />
            <Button onClick={handleCreate} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              添加
            </Button>
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        {/* 标签列表 */}
        <div className="flex-1 overflow-y-auto border rounded-lg p-4 space-y-2">
          {loading ? (
            <p className="text-center text-muted-foreground">加载中...</p>
          ) : tags.length === 0 ? (
            <p className="text-center text-muted-foreground">暂无自定义标签</p>
          ) : (
            tags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
              >
                {editingTag?.id === tag.id ? (
                  <div className="flex-1 flex gap-2 items-center">
                    <Input
                      value={editingTag.content}
                      onChange={(e) => setEditingTag({ ...editingTag, content: e.target.value })}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdate();
                        } else if (e.key === 'Escape') {
                          setEditingTag(null);
                        }
                      }}
                      autoFocus
                    />
                    <Button onClick={handleUpdate} size="sm" variant="outline">
                      保存
                    </Button>
                    <Button onClick={() => setEditingTag(null)} size="sm" variant="ghost">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Badge variant="outline" className="text-sm">
                      {tag.content}
                    </Badge>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setEditingTag(tag)}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(tag.id)}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))
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


