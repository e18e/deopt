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
  #indexedGroups;
  #initialState;

  constructor(props) {
    super(props);

    const { groups } = props;
    this.#indexedGroups = Array.from(groups);

    this.#initialState = Object.assign(initialState, this.#stateFromUrl());
    this.state = Object.assign({}, this.#initialState);

    window.addEventListener('popstate', this.#restoreStateFromHistory);
  }

  render() {
    const { includeAllSeverities } = this.state;

    return (
      <div className="app">
        <header className="toolbar">
          <nav className="tabs">
            {this.#renderTabHeader('Files', FILES_TAB_IDX)}
            {this.#renderTabHeader('Details', DETAILS_TAB_IDX)}
          </nav>
          <ToolbarView
            className="toolbar-options"
            includeAllSeverities={includeAllSeverities}
            onIncludeAllSeveritiesChanged={this.#onIncludeAllSeveritiesChanged}
          />
        </header>
        {this.#renderTabs()}
      </div>
    );
  }

  /*
   * Tabs
   */

  #renderTabHeader(label, idx) {
    const { selectedTabIdx } = this.state;
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

  #renderTabs() {
    const { selectedTabIdx } = this.state;
    return (
      <main className="content">
        {selectedTabIdx === FILES_TAB_IDX
          ? this.#renderFiles()
          : this.#renderFileDetails()}
      </main>
    );
  }

  /*
   * Contents
   */
  #renderFiles() {
    const { groups } = this.props;
    const { selectedFile, includeAllSeverities } = this.state;

    return (
      <FilesView
        className="panel"
        selectedFile={selectedFile}
        groups={groups}
        includeAllSeverities={includeAllSeverities}
        onFileClicked={this.#onFileClicked}
      />
    );
  }

  #renderFileDetails() {
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
        onMarkerClicked={this.#onLocationSelected}
        onSummaryClicked={this.#onLocationSelected}
        onSummaryTabIdxChanged={this.#onSummaryTabIdxChanged}
      />
    );
  }

  /*
   * URL State
   */
  #indexFromFile(file) {
    for (var i = 0; i < this.#indexedGroups.length; i++) {
      const key = this.#indexedGroups[i][0];
      if (key === file) return i;
    }
    return -1;
  }

  #fileFromIndex(idx) {
    if (idx < 0) return null;
    if (this.#indexedGroups[idx] == null) return null;
    return this.#indexedGroups[idx][0];
  }

  #updateUrl = () => {
    const {
      selectedFile,
      selectedLocation,
      includeAllSeverities,
      selectedTabIdx,
      selectedSummaryTabIdx,
    } = this.state;

    const state = {
      selectedFileIdx: this.#indexFromFile(selectedFile),
      selectedLocation,
      includeAllSeverities,
      selectedTabIdx,
      selectedSummaryTabIdx,
    };
    try {
      history.pushState(state, 'deopt', urlFromState(state));
    } catch {
      // some browsers like Safari block this in the name of security
      // if we opened the index file directly, i.e. the page isn't served
    }
  };

  #restoreStateFromHistory = () => {
    if (history.state == null) return null;

    let {
      selectedFileIdx,
      selectedLocation,
      includeAllSeverities,
      selectedTabIdx,
      selectedSummaryTabIdx,
    } = history.state;
    if (selectedLocation === '') selectedLocation = null;

    const selectedFile = this.#fileFromIndex(selectedFileIdx);
    const override = {
      includeAllSeverities,
      selectedFile,
      selectedTabIdx,
      selectedLocation,
      selectedSummaryTabIdx,
    };

    this.setState(Object.assign(this.state, override));
  };

  #stateFromUrl() {
    const state = stateFromUrl();
    if (state == null) return null;
    const {
      selectedFileIdx,
      selectedLocation,
      includeAllSeverities,
      selectedTabIdx,
      selectedSummaryTabIdx,
    } = state;
    const selectedFile = this.#fileFromIndex(selectedFileIdx);
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
  #onTabHeaderClicked(idx) {
    this.setState(
      Object.assign(this.state, { selectedTabIdx: idx }),
      this.#updateUrl,
    );
  }

  #onLocationSelected = (id) => {
    this.setState(
      Object.assign(this.state, {
        selectedLocation: id,
        locationSeq: this.state.locationSeq + 1,
      }),
      this.#updateUrl,
    );
  };

  #onSummaryTabIdxChanged = (idx) => {
    this.setState(
      Object.assign(this.state, { selectedSummaryTabIdx: idx }),
      this.#updateUrl,
    );
  };

  #onIncludeAllSeveritiesChanged = (includeAllSeverities) => {
    this.setState(
      Object.assign(this.state, {
        includeAllSeverities,
        selectedLocation: null,
      }),
      this.#updateUrl,
    );
  };

  #onFileClicked = (file) => {
    this.setState(
      Object.assign(this.state, {
        selectedFile: file,
        selectedLocation: null,
        // auto open details view when file is selected
        selectedTabIdx: DETAILS_TAB_IDX,
      }),
      this.#updateUrl,
    );
  };
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
