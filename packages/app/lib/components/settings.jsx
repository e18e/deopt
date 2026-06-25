import * as store from '../store.js';

export function SettingsView({ className = '' }) {
  const onToggleSeverities = (e) => {
    store.setIncludeAllSeverities(e.target.checked);
  };

  const onToggleNodeModules = (e) => {
    store.setHideNodeModules(!e.target.checked);
  };

  return (
    <div className={className}>
      <label className="option">
        <input
          type="checkbox"
          checked={store.includeAllSeverities.value}
          onChange={onToggleSeverities}
        />
        Show low severities
      </label>
      <label className="option">
        <input
          type="checkbox"
          checked={!store.hideNodeModules.value}
          onChange={onToggleNodeModules}
        />
        Show node_modules
      </label>
    </div>
  );
}
