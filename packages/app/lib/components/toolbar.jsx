import * as store from '../store.js';

export function ToolbarView({ className = '' }) {
  const onToggle = (e) => {
    store.setIncludeAllSeverities(e.target.checked);
  };

  return (
    <div className={className}>
      <label className="option">
        Low Severities
        <input
          type="checkbox"
          checked={store.includeAllSeverities.value}
          onChange={onToggle}
        />
      </label>
    </div>
  );
}
