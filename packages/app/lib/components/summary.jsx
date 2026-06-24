import { Component } from 'preact';

import { MIN_SEVERITY } from '@e18e/deopt-shared';

const severityClassNames = ['green i', 'blue', 'red b'];

const OPT_TAB_IDX = 0;
const DEOPT_TAB_IDX = 1;
const ICS_TAB_IDX = 2;

export class SummaryView extends Component {
  #maybeScrollIntoView() {
    const { selectedLocation } = this.props;
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
    const {
      className = '',
      ics,
      icLocations,
      deopts,
      deoptLocations,
      codes,
      codeLocations,
      selectedTabIdx,
    } = this.props;
    const renderedDeopts = this.#renderDeopts(
      deopts,
      deoptLocations,
      selectedTabIdx === DEOPT_TAB_IDX,
    );
    const renderedIcs = this.#renderIcs(
      ics,
      icLocations,
      selectedTabIdx === ICS_TAB_IDX,
    );
    const renderedCodes = this.#renderCodes(
      codes,
      codeLocations,
      selectedTabIdx === OPT_TAB_IDX,
    );
    return (
      <div className={className}>
        <div className="tabs">
          {this.#renderTabHeader('Optimizations', OPT_TAB_IDX)}
          {this.#renderTabHeader('Deoptimizations', DEOPT_TAB_IDX)}
          {this.#renderTabHeader('Inline Caches', ICS_TAB_IDX)}
        </div>
        <div>
          {renderedCodes}
          {renderedDeopts}
          {renderedIcs}
        </div>
      </div>
    );
  }

  /*
   * Tabs
   */

  #renderTabHeader(label, idx) {
    const { selectedTabIdx } = this.props;
    const selected = idx === selectedTabIdx;
    const className = selected ? 'tab selected' : 'tab';

    return (
      <a
        className={className}
        href="#"
        onClick={() => this.#onTabHeaderClicked(idx)}
      >
        {label}
      </a>
    );
  }

  #renderDataPoint(data, locations, renderDetails) {
    const { selectedLocation, includeAllSeverities, relativePath } = this.props;
    if (locations.length === 0) return <p className="summary-empty">None</p>;
    const rendered = [];
    for (const loc of locations) {
      const info = data.get(loc);
      if (!includeAllSeverities && info.severity <= MIN_SEVERITY) continue;

      const className =
        selectedLocation === info.id ? 'summary-card selected' : 'summary-card';
      rendered.push(
        <div className={className} key={info.id}>
          {this.#summary(info, relativePath)}
          {renderDetails(info)}
        </div>,
      );
    }
    return rendered;
  }

  #renderIcs(ics, icLocations, selected) {
    if (ics == null || !selected) return null;
    return (
      <div key="ics">
        {this.#renderDataPoint(ics, icLocations, this.#renderIc)}
      </div>
    );
  }

  #renderDeopts(deopts, deoptLocations, selected) {
    if (deopts == null || !selected) return null;
    return (
      <div key="deopts">
        {this.#renderDataPoint(deopts, deoptLocations, this.#renderDeopt)}
      </div>
    );
  }

  #renderCodes(codes, codeLocations, selected) {
    if (codes == null || !selected) return null;
    return (
      <div key="optimizations">
        {this.#renderDataPoint(codes, codeLocations, this.#renderCode)}
      </div>
    );
  }

  #summary(info, relativePath) {
    const { id, functionName, line, column } = info;
    const locationEl = <span className="summary-location">{id}</span>;
    const onClicked = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.#onSummaryClicked(id);
    };

    const fullLoc = (
      <a href="#" className="summary-link" onClick={onClicked}>
        {functionName} at {relativePath}:{line}:{column}
      </a>
    );
    return (
      <div id={'summary-location-' + id}>
        {locationEl}
        {fullLoc}
      </div>
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
  #onTabHeaderClicked(idx) {
    const { onTabHeaderClicked } = this.props;
    onTabHeaderClicked(idx);
  }

  #onSummaryClicked(id) {
    const { onSummaryClicked } = this.props;
    onSummaryClicked(id);
  }

  static get OPT_TAB_IDX() {
    return OPT_TAB_IDX;
  }
  static get DEOPT_TAB_IDX() {
    return DEOPT_TAB_IDX;
  }
  static get ICS_TAB_IDX() {
    return ICS_TAB_IDX;
  }
}
