import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 标签去重和标准化工具函数
 */
export function deduplicateAndNormalizeTags(tags: {
  languages?: string[];
  frameworks?: string[];
  features?: string[];
  technologies?: string[];
  tools?: string[];
  domains?: string[];
  categories?: string[];
}): string[] {
  // 合并所有标签分类到一个数组中
  const allTags = [
    ...(tags.languages || []),
    ...(tags.frameworks || []),
    ...(tags.features || []),
    ...(tags.technologies || []),
    ...(tags.tools || []),
    ...(tags.domains || []),
    ...(tags.categories || [])
  ];

  // 标准化和去重
  const normalizedTags = allTags
    .map(tag => {
      // 去除首尾空格
      const trimmed = tag?.trim();
      
      // 过滤掉空值、空字符串、null、undefined
      if (!trimmed || trimmed === '' || trimmed === 'null' || trimmed === 'undefined') {
        return null;
      }
      
      // 统一大小写（首字母大写，其余小写）
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    })
    .filter((tag): tag is string => tag !== null) // 过滤掉null值
    .filter((tag, index, array) => array.indexOf(tag) === index); // 去重

  return normalizedTags;
}
