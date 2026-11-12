import { FILTERS, PRIORITY_STYLE } from '../lib/priority';

/**
 * 优先级筛选：全部 / 高 / 中 / 低，右侧显示该优先级任务数量
 */
export default function FilterBar({ filter, counts, onChange }) {
  return (
    <nav className="filters" aria-label="按优先级筛选">
      {FILTERS.map((item) => {
        const active = filter === item;
        return (
          <button
            key={item}
            type="button"
            className={active ? 'filter is-active' : 'filter'}
            aria-pressed={active}
            onClick={() => onChange(item)}
          >
            {item !== '全部' && (
              <i className={`dot dot--${PRIORITY_STYLE[item]}`} aria-hidden="true" />
            )}
            {item}
            <span className="filter__count">{counts[item] || 0}</span>
          </button>
        );
      })}
    </nav>
  );
}
