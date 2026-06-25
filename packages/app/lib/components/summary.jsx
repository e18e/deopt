import { Component } from 'preact';

import { describeDiagnostic, tipForDiagnostic } from '@e18e/deopt-shared';
import * as store from '../store.js';

const severityClassNames = ['green i', 'blue', 'red b'];

const severityTitles = ['low', 'medium', 'high'];

export class SummaryView extends Component {
  #maybeScrollIntoView() {
    const selectedLocation = store.selectedLocation.value;
    if (selectedLocation == null) return;
    const summary = document.getElementById(
      `summary-location-${selectedLocation}`,
    );
    if (summary == null) return;
    const { top, bottom } = summary.getBoundingClientRect();
    const inView = top >= 0 && bottom <= window.innerHeight;
    if (inView) return;
    summary.scrollIntoView({ behavior: 'smooth' });
  }

  componentDidMount() {
    this.#maybeScrollIntoView();
  }

  componentDidUpdate() {
    this.#maybeScrollIntoView();
  }

  render() {
    const { className = '' } = this.props;
    const diagnostics = store.currentDiagnostics.value;
    if (diagnostics.length === 0) {
      return (
        <div className={className}>
          <p className="summary-empty">None</p>
        </div>
      );
    }
    return (
      <div className={className}>
        <div className="summary-hint">
          <span className="summary-hint-label">Shortcuts:</span>
          <span>
            <kbd className="key">j</kbd>
            <kbd className="key">k</kbd>
            next / previous
          </span>
        </div>
        {diagnostics.map(({ kind, info }) =>
          this.#renderDiagnostic(kind, info),
        )}
      </div>
    );
  }

  #renderDiagnostic(kind, info) {
    const selected = store.selectedLocation.value === info.id;
    const className = selected ? 'summary-card selected' : 'summary-card';
    return (
      <div
        className={className}
        key={kind + ':' + info.id}
        id={'summary-location-' + info.id}
      >
        {this.#summary(kind, info, selected)}
        {selected ? this.#renderDetails(kind, info) : null}
      </div>
    );
  }

  #summary(kind, info, selected) {
    const { id, functionName, line, column, severity, updates } = info;
    const count = updates.length;
    const onClicked = (e) => {
      e.preventDefault();
      this.#onSummaryClicked(selected ? null : id);
    };
    return (
      <a href="#" className="summary-row" onClick={onClicked}>
        <span
          className={`summary-severity sev-${severity}`}
          title={severityTitles[severity - 1]}
          aria-label={severityTitles[severity - 1]}
        >
          ●
        </span>
        <span className="summary-pos">
          L{line}:{column}
        </span>
        <span className="summary-kind">
          {describeDiagnostic({ kind, info })}
        </span>
        <span className="summary-link">{functionName}</span>
        {count > 1 ? <span className="summary-count">×{count}</span> : null}
      </a>
    );
  }

  #renderDetails(kind, info) {
    const tip = tipForDiagnostic({ kind, info });
    let table;
    if (kind === 'deopt') table = this.#renderDeopt(info);
    else if (kind === 'ic') table = this.#renderIc(info);
    else table = this.#renderCode(info);
    return (
      <>
        {tip != null ? (
          <p className="summary-tip">
            <span className="summary-tip-icon" aria-hidden="true">
              ⓘ
            </span>
            {tip}
          </p>
        ) : null}
        {table}
      </>
    );
  }

  #renderDeopt = (info) => {
    const rows = info.updates.map((update, idx) => this.#deoptRow(update, idx));
    return (
      <table key={'deopt:' + info.id}>
        <thead>
          <tr>
            <td class="col-head">Timestamp</td>
            <td class="col-head">Bailout</td>
            <td class="col-head">Reason</td>
            <td class="col-head">Inlined</td>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    );
  };

  #deoptRow(info) {
    const { inlined, bailoutType, deoptReason, timestamp, severity } = info;
    const bailoutClassName = severityClassNames[severity - 1];
    const timeStampMs = (timestamp / 1e3).toFixed();
    return (
      <tr key={timestamp}>
        <td>{timeStampMs}ms</td>
        <td className={bailoutClassName}>{bailoutType}</td>
        <td>{deoptReason}</td>
        <td className="gray">{inlined ? 'yes' : 'no'}</td>
      </tr>
    );
  }

  #renderIc = (info) => {
    const rows = info.updates.map((update, idx) => this.#icRow(update, idx));
    return (
      <table key={'ic:' + info.id}>
        <thead>
          <tr>
            <td class="col-head">Old State</td>
            <td class="col-head">New State</td>
            <td class="col-head">Key</td>
            <td class="col-head">Map</td>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    );
  };

  #icRow(update, id) {
    const {
      key,
      map,
      oldStateName,
      oldStateSeverity,
      newStateName,
      newStateSeverity,
    } = update;
    const oldStateClassName = severityClassNames[oldStateSeverity - 1];
    const newStateClassName = severityClassNames[newStateSeverity - 1];

    const mapString = `0x${map}`;
    return (
      <tr key={key + id}>
        <td className={oldStateClassName}>{oldStateName}</td>
        <td className={newStateClassName}>{newStateName}</td>
        <td>{key}</td>
        <td className="gray">{mapString}</td>
      </tr>
    );
  }

  #renderCode = (info) => {
    const rows = info.updates.map((update) => this.#codeRow(update));
    return (
      <table key={'code:' + info.id}>
        <thead>
          <tr>
            <td class="col-head">Timestamp</td>
            <td class="col-head">Optimization State</td>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    );
  };

  #codeRow(info) {
    const { timestamp, stateName, severity } = info;
    const timeStampMs = (timestamp / 1e3).toFixed();
    const codeStateClassName = severityClassNames[severity - 1];

    return (
      <tr key={timestamp}>
        <td>{timeStampMs}ms</td>
        <td className={codeStateClassName}>{stateName}</td>
      </tr>
    );
  }

  /*
   * Events
   */
  #onSummaryClicked(id) {
    store.selectLocation(id);
  }
}
