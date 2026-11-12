/**
 * 前端「智能优先级建议」规则
 * 输入任务标题时，如果命中下列关键词，就提示推荐的优先级
 */

const HIGH_WORDS = [
  '紧急', '尽快', '马上', '立刻', '立即', '今天', '今晚', '截止',
  'ddl', 'deadline', '重要', '必须', '务必', '考试', '提交'
];

const LOW_WORDS = ['不急', '有空', '随时', '以后', '顺便', '可选', '随便'];

/**
 * @param {string} text 用户输入的标题
 * @returns {{priority: string, word: string} | null}
 */
export function suggestPriority(text) {
  if (!text) return null;
  const value = text.toLowerCase();

  const lowWord = LOW_WORDS.find((word) => value.includes(word));
  if (lowWord) return { priority: '低', word: lowWord };

  const highWord = HIGH_WORDS.find((word) => value.includes(word.toLowerCase()));
  if (highWord) return { priority: '高', word: highWord };

  return null;
}
