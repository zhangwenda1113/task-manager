import { PRIORITY_STYLE } from '../lib/priority';
import { formatTime } from '../lib/format';

/**
 * 单条任务：完成勾选 + 标题 + 优先级 + 创建时间 + 完成/未完成 切换 + 删除
 */
export default function TaskItem({ task, onToggle, onDelete }) {
  const styleKey = PRIORITY_STYLE[task.priority] || 'medium';
  const toggleLabel = task.completed ? '未完成' : '完成';
  const toggleTitle = task.completed ? '撤销完成，改回未完成' : '把任务标记为已完成';

  return (
    <li className="task">
      <button
        type="button"
        className={task.completed ? 'check is-done' : 'check'}
        aria-label={toggleTitle}
        title={toggleTitle}
        onClick={() => onToggle(task)}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3 8.4l3.2 3.2L13 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <div className="task-body">
        <p className={task.completed ? 'task-title is-done' : 'task-title'}>{task.title}</p>
        <div className="task-meta">
          <span className={`task-meta__prio task-meta__prio--${styleKey}`}>
            <i className={`dot dot--${styleKey}`} aria-hidden="true" />
            {task.priority}
          </span>
          <span>{formatTime(task.createdAt)}</span>
          {task.completed && <span>已完成</span>}
        </div>
      </div>

      <div className="task-actions">
        <button type="button" className="btn btn--ghost" title={toggleTitle} onClick={() => onToggle(task)}>
          {toggleLabel}
        </button>
        <button type="button" className="btn btn--ghost btn--danger" onClick={() => onDelete(task)}>
          删除
        </button>
      </div>
    </li>
  );
}
