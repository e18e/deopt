import { render } from 'preact';
import './main.css';
import * as store from './store.js';

import { ToolbarView } from './components/toolbar.jsx';
import { FilesView } from './components/files.jsx';
import { FileDetailsView } from './components/file-details.jsx';

function app() {
  // makes React happy
  document.body.innerHTML = '';
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

function TabHeader({ label, idx }) {
  const selected = idx === store.selectedTabIdx.value;
  const className = selected ? 'tab selected' : 'tab';

  const onClick = (e) => {
    e.preventDefault();
    store.selectTab(idx);
  };

  return (
    <a className={className} href="#" onClick={onClick}>
      {label}
    </a>
  );
}

function MainView() {
  const selectedTabIdx = store.selectedTabIdx.value;

  return (
    <div className="app">
      <header className="toolbar">
        <nav className="tabs">
          <TabHeader label="Files" idx={store.FILES_TAB_IDX} />
          <TabHeader label="Details" idx={store.DETAILS_TAB_IDX} />
        </nav>
        <ToolbarView className="toolbar-options" />
      </header>
      <main className="content">
        {selectedTabIdx === store.FILES_TAB_IDX ? (
          <FilesView className="panel" />
        ) : (
          <Details />
        )}
      </main>
    </div>
  );
}

function Details() {
  if (store.currentGroup.value == null) {
    return (
      <div className="summary-empty">
        Please select a file in the Files table
      </div>
    );
  }
  return <FileDetailsView className="details-panel" />;
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
    store.groups.value = reviveGroups(await res.json());
    store.initHistorySync();
    render(<MainView />, app());
  } catch (err) {
    console.error(err);
  }
}
