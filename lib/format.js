/** 前端展示用的小工具函数 */

export function pad(n) {
  return String(n).padStart(2, '0');
}

/** 把 ISO 时间格式化成「今天 16:02 / 昨天 15:00 / 11月10日 09:20」 */
export function formatTime(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const hm = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  const sameDay = date.toDateString() === now.toDateString();
  const yesterday = new Date(now.getTime() - 86400000);

  if (sameDay) return `今天 ${hm}`;
  if (date.toDateString() === yesterday.toDateString()) return `昨天 ${hm}`;
  if (date.getFullYear() === now.getFullYear()) {
    return `${date.getMonth() + 1}月${date.getDate()}日 ${hm}`;
  }
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}
