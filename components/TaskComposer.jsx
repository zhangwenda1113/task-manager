'use client';

import { useRef, useState } from 'react';
import { PRIORITIES } from '../lib/priority';
import { suggestPriority } from '../lib/smart';

/**
 * 添加任务区：输入框 + 优先级下拉 + 添加按钮 + 智能优先级提示
 */
export default function TaskComposer({ submitting, onAdd }) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('中');
  const inputRef = useRef(null);

  const suggestion = suggestPriority(title);
  const showHint = suggestion && suggestion.priority !== priority;

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    const value = title.trim();
    const ok = await onAdd(value, priority);
    if (ok) {
      setTitle('');
      inputRef.current?.focus();
    }
  }

  return (
    <section className="composer">
      <form className="composer__form" onSubmit={handleSubmit} autoComplete="off">
        <label className="sr-only" htmlFor="task-input">任务标题</label>
        <input
          id="task-input"
          ref={inputRef}
          className="composer__input"
          type="text"
          name="title"
          maxLength={120}
          placeholder="添加一个新任务，例如：周五前提交实验报告"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          autoFocus
        />

        <div className="select-wrap">
          <label className="sr-only" htmlFor="priority-select">优先级</label>
          <select
            id="priority-select"
            className="composer__select"
            name="priority"
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
          >
            {PRIORITIES.map((item) => (
              <option key={item} value={item}>优先级：{item}</option>
            ))}
          </select>
          <svg className="select-wrap__arrow" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4 6.5l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </div>

        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? '添加中…' : '添加'}
        </button>
      </form>

      {showHint && (
        <p className="composer__hint">
          <span>检测到「{suggestion.word}」，建议优先级设为「{suggestion.priority}」</span>
          <button type="button" className="link-btn" onClick={() => setPriority(suggestion.priority)}>
            采用建议
          </button>
        </p>
      )}
    </section>
  );
}
