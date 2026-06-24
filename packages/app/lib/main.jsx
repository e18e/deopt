import { Component, render } from 'preact';
import './main.css';
import { urlFromState, stateFromUrl } from './query-state.js';

import { ToolbarView } from './components/toolbar.jsx';
import { FilesView } from './components/files.jsx';
import { SummaryView } from './components/summary.jsx';
import { FileDetailsView } from './components/file-details.jsx';

const FILES_TAB_IDX = 0;
const DETAILS_TAB_IDX = 1;

function app() {
  // makes React happy
  document.body.innerHTML = '';
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

const initialState = {
  selectedFile: null,
  selectedLocation: null,
  locationSeq: 0,
  selectedSummaryTabIdx: SummaryView.OPT_TAB_IDX,
  includeAllSeverities: false,
  selectedTabIdx: FILES_TAB_IDX,
};

class MainView extends Component {
  constructor(props) {
    super(props);

    const { groups } = props;
    this._indexedGroups = Array.from(groups);

    this._initialState = Object.assign(initialState, this._stateFromUrl());
    this.state = Object.assign({}, this._initialState);

    this._bind();
    window.onpopstate = this._restoreStateFromHistory;
  }

  _bind() {
    this._onlocationSelected = this._onlocationSelected.bind(this);
    this._onsummaryTabIdxChanged = this._onsummaryTabIdxChanged.bind(this);
    this._onincludeAllSeveritiesChanged =
      this._onincludeAllSeveritiesChanged.bind(this);
    this._onFileClicked = this._onFileClicked.bind(this);
    this._updateUrl = this._updateUrl.bind(this);
    this._restoreStateFromHistory = this._restoreStateFromHistory.bind(this);
  }

  render() {
    const { includeAllSeverities } = this.state;

    return (
      <div className="app">
        <header className="toolbar">
          <nav className="tabs">
            {this._renderTabHeader('Files', FILES_TAB_IDX)}
            {this._renderTabHeader('Details', DETAILS_TAB_IDX)}
          </nav>
          <ToolbarView
            className="toolbar-options"
            includeAllSeverities={includeAllSeverities}
            onincludeAllSeveritiesChanged={this._onincludeAllSeveritiesChanged}
          />
        </header>
        {this._renderTabs()}
      </div>
    );
  }

  /*
   * Tabs
   */

  _renderTabHeader(label, idx) {
    const { selectedTabIdx } = this.state;
    const selected = idx === selectedTabIdx;
    const className = selected ? 'tab selected' : 'tab';

    return (
      <a
        className={className}
        href="#"
        onClick={() => this._ontabHeaderClicked(idx)}
      >
        {label}
      </a>
    );
  }

  _renderTabs() {
    const { selectedTabIdx } = this.state;
    return (
      <main className="content">
        {selectedTabIdx === FILES_TAB_IDX
          ? this._renderFiles()
          : this._renderFileDetails()}
      </main>
    );
  }

  /*
   * Contents
   */
  _renderFiles() {
    const { groups } = this.props;
    const { selectedFile, includeAllSeverities } = this.state;

    return (
      <FilesView
        className="panel"
        selectedFile={selectedFile}
        groups={groups}
        includeAllSeverities={includeAllSeverities}
        onFileClicked={this._onFileClicked}
      />
    );
  }

  _renderFileDetails() {
    const { groups } = this.props;
    const {
      selectedFile,
      selectedLocation,
      locationSeq,
      selectedSummaryTabIdx,
      includeAllSeverities,
    } = this.state;
    if (selectedFile == null || !groups.has(selectedFile)) {
      return (
        <div className="summary-empty">
          Please select a file in the Files table
        </div>
      );
    }

    return (
      <FileDetailsView
        groups={groups}
        selectedFile={selectedFile}
        selectedLocation={selectedLocation}
        locationSeq={locationSeq}
        selectedSummaryTabIdx={selectedSummaryTabIdx}
        includeAllSeverities={includeAllSeverities}
        className="details-panel"
        onmarkerClicked={this._onlocationSelected}
        onsummaryClicked={this._onlocationSelected}
        onsummaryTabIdxChanged={this._onsummaryTabIdxChanged}
      />
    );
  }

  /*
   * URL State
   */
  _indexFromFile(file) {
    for (var i = 0; i < this._indexedGroups.length; i++) {
      const key = this._indexedGroups[i][0];
      if (key === file) return i;
    }
    return -1;
  }

  _fileFromIndex(idx) {
    if (idx < 0) return null;
    if (this._indexedGroups[idx] == null) return null;
    return this._indexedGroups[idx][0];
  }

  _updateUrl() {
    const {
      selectedFile,
      selectedLocation,
      includeAllSeverities,
      selectedTabIdx,
      selectedSummaryTabIdx,
    } = this.state;

    const state = {
      selectedFileIdx: this._indexFromFile(selectedFile),
      selectedLocation,
      includeAllSeverities,
      selectedTabIdx,
      selectedSummaryTabIdx,
    };
    try {
      history.pushState(state, 'deopt', urlFromState(state));
    } catch (e) {
      // some browsers like Safari block this in the name of security
      // if we opened the index file directly, i.e. the page isn't served
    }
  }

  _restoreStateFromHistory(e) {
    if (history.state == null) return null;

    let {
      selectedFileIdx,
      selectedLocation,
      includeAllSeverities,
      selectedTabIdx,
      selectedSummaryTabIdx,
    } = history.state;
    if (selectedLocation === '') selectedLocation = null;

    const selectedFile = this._fileFromIndex(selectedFileIdx);
    const override = {
      includeAllSeverities,
      selectedFile,
      selectedTabIdx,
      selectedLocation,
      selectedSummaryTabIdx,
    };

    this.setState(Object.assign(this.state, override));
  }

  _stateFromUrl() {
    const state = stateFromUrl();
    if (state == null) return null;
    const {
      selectedFileIdx,
      selectedLocation,
      includeAllSeverities,
      selectedTabIdx,
      selectedSummaryTabIdx,
    } = state;
    const selectedFile = this._fileFromIndex(selectedFileIdx);
    return {
      selectedFile,
      selectedLocation,
      includeAllSeverities,
      selectedTabIdx,
      selectedSummaryTabIdx,
    };
  }

  /*
   * Events
   */
  _ontabHeaderClicked(idx) {
    this.setState(
      Object.assign(this.state, { selectedTabIdx: idx }),
      this._updateUrl,
    );
  }

  _onlocationSelected(id) {
    this.setState(
      Object.assign(this.state, {
        selectedLocation: id,
        locationSeq: this.state.locationSeq + 1,
      }),
      this._updateUrl,
    );
  }

  _onsummaryTabIdxChanged(idx) {
    this.setState(
      Object.assign(this.state, { selectedSummaryTabIdx: idx }),
      this._updateUrl,
    );
  }

  _onincludeAllSeveritiesChanged(includeAllSeverities) {
    this.setState(
      Object.assign(this.state, {
        includeAllSeverities,
        selectedLocation: null,
      }),
      this._updateUrl,
    );
  }

  _onFileClicked(file) {
    this.setState(
      Object.assign(this.state, {
        selectedFile: file,
        selectedLocation: null,
        // auto open details view when file is selected
        selectedTabIdx: DETAILS_TAB_IDX,
      }),
      this._updateUrl,
    );
  }
}

function reviveGroups(payload) {
  return new Map(
    payload.map(([file, group]) => [
      file,
      Object.assign({}, group, {
        ics: new Map(group.ics),
        deopts: new Map(group.deopts),
        codes: new Map(group.codes),
      }),
    ]),
  );
}

export async function mount() {
  try {
    const res = await fetch('/api/data');
    const groups = reviveGroups(await res.json());
    render(<MainView groups={groups} />, app());
  } catch (err) {
    console.error(err);
  }
}
