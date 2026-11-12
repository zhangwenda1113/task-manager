'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import TaskComposer from '../components/TaskComposer';
import FilterBar from '../components/FilterBar';
import TaskItem from '../components/TaskItem';
import { FILTERS } from '../lib/priority';

/** 统一的请求封装：失败时抛出带中文提示的错误 */
async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload || payload.ok === false) {
    throw new Error((payload && payload.message) || `请求失败（${res.status}）`);
  }
  return payload;
}

export default function HomePage() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('全部');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [storage, setStorage] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '' });
  const toastTimer = useRef(null);

  const showToast = useCallback((message) => {
    setToast({ visible: true, message });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2600);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const payload = await request('/api/tasks');
        if (!cancelled) setTasks(payload.data || []);
      } catch (error) {
        if (!cancelled) showToast(error.message || '任务加载失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    async function loadHealth() {
      try {
        const info = await request('/api/health');
        if (!cancelled) setStorage(info.storage);
      } catch {
        /* 状态提示失败不影响主流程 */
      }
    }

    load();
    loadHealth();
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const counts = useMemo(() => {
    const result = { 全部: tasks.length, 高: 0, 中: 0, 低: 0 };
    tasks.forEach((task) => {
      result[task.priority] = (result[task.priority] || 0) + 1;
    });
    return result;
  }, [tasks]);

  const filteredTasks = useMemo(
    () => (filter === '全部' ? tasks : tasks.filter((task) => task.priority === filter)),
    [tasks, filter]
  );

  const doneCount = useMemo(() => tasks.filter((task) => task.completed).length, [tasks]);
  const pendingCount = tasks.length - doneCount;
  const percent = tasks.length === 0 ? 0 : Math.round((doneCount / tasks.length) * 100);

  /** 新增任务 */
  const addTask = useCallback(
    async (title, priority) => {
      if (!title) {
        showToast('请先输入任务标题');
        return false;
      }
      setSubmitting(true);
      try {
        const payload = await request('/api/tasks', {
          method: 'POST',
          body: JSON.stringify({ title, priority })
        });
        setTasks((prev) => [payload.data, ...prev]);
        if (filter !== '全部' && filter !== payload.data.priority) setFilter('全部');
        showToast('任务已添加');
        return true;
      } catch (error) {
        showToast(error.message || '添加失败');
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [filter, showToast]
  );

  /** 切换完成 / 未完成（先乐观更新，失败回滚） */
  const toggleTask = useCallback(
    async (task) => {
      const nextCompleted = !task.completed;
      setTasks((prev) =>
        prev.map((item) => (item.id === task.id ? { ...item, completed: nextCompleted } : item))
      );
      try {
        const payload = await request(`/api/tasks/${task.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ completed: nextCompleted })
        });
        setTasks((prev) => prev.map((item) => (item.id === task.id ? payload.data : item)));
      } catch (error) {
        setTasks((prev) =>
          prev.map((item) => (item.id === task.id ? { ...item, completed: !nextCompleted } : item))
        );
        showToast(error.message || '更新失败');
      }
    },
    [showToast]
  );

  /** 删除任务 */
  const deleteTask = useCallback(
    async (task) => {
      try {
        await request(`/api/tasks/${task.id}`, { method: 'DELETE' });
        setTasks((prev) => prev.filter((item) => item.id !== task.id));
        showToast('任务已删除');
      } catch (error) {
        showToast(error.message || '删除失败');
      }
    },
    [showToast]
  );

  const emptyTitle =
    tasks.length === 0 ? '还没有任务' : `没有「${filter}」优先级的任务`;
  const emptyDesc =
    tasks.length === 0 ? '在上面的输入框写下第一件要做的事' : '可以切换到其他筛选条件，或添加一个新任务';

  return (
    <main className="shell">
      <header className="masthead">
        <div className="masthead__text">
          <h1>智能任务管理</h1>
          <p className="masthead__sub">把要做的事，按轻重缓急排清楚</p>
        </div>
        <div className="stats" aria-live="polite">
          <div className="stats__numbers">
            <span className="stats__item"><b>{pendingCount}</b> 待办</span>
            <span className="stats__sep">/</span>
            <span className="stats__item"><b>{doneCount}</b> 已完成</span>
          </div>
          <div className="stats__bar" role="img" aria-label={`完成进度 ${percent}%`}>
            <i style={{ width: `${percent}%` }} />
          </div>
        </div>
      </header>

      <TaskComposer submitting={submitting} onAdd={addTask} />

      <FilterBar filter={filter} counts={counts} onChange={setFilter} />

      {loading ? (
        <div className="state">
          <span className="spinner" aria-hidden="true" />
          <span>正在加载任务…</span>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="state state--empty">
          <svg viewBox="0 0 64 64" aria-hidden="true" className="state__icon">
            <rect x="8" y="12" width="48" height="42" rx="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M18 26h20M18 34h14M18 42h20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <p className="state__title">{emptyTitle}</p>
          <p className="state__desc">{emptyDesc}</p>
        </div>
      ) : (
        <ul className="task-list">
          {filteredTasks.map((task) => (
            <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
          ))}
        </ul>
      )}

      <footer className="colophon">
        <span>
          {storage === 'supabase'
            ? '数据源：Supabase 云端数据库'
            : '数据源：本地 JSON 文件（未配置 Supabase）'}
        </span>
      </footer>

      <div className={toast.visible ? 'toast is-visible' : 'toast'} role="status" aria-live="polite">
        {toast.message}
      </div>
    </main>
  );
}
