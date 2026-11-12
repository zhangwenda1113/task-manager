/**
 * 优先级常量（前后端共用）
 * 与 Supabase tasks 表的 priority 字段保持一致：'高' / '中' / '低'
 */

export const PRIORITIES = ['高', '中', '低'];
export const DEFAULT_PRIORITY = '中';
export const FILTERS = ['全部', '高', '中', '低'];

/** 把中文优先级映射成样式名，便于 CSS 着色 */
export const PRIORITY_STYLE = {
  高: 'high',
  中: 'medium',
  低: 'low'
};

export function isPriority(value) {
  return PRIORITIES.includes(value);
}

export function isFilter(value) {
  return FILTERS.includes(value);
}

/** 统一校验任务标题 */
export function normalizeTitle(rawTitle) {
  if (typeof rawTitle !== 'string') {
    return { ok: false, message: '任务标题不能为空' };
  }
  const title = rawTitle.trim().replace(/\s+/g, ' ');
  if (!title) return { ok: false, message: '任务标题不能为空' };
  if (title.length > 120) return { ok: false, message: '任务标题最多 120 个字符' };
  return { ok: true, title };
}
