import { Component } from 'preact';

import * as store from '../store.js';
import { MarkerResolver } from '../rendering/marker-resolver.jsx';
import { markOnly } from '../rendering/mark-only.jsx';

const MAX_HIGHLIGHT_LEN = 1e5;

const WORD = /[\w$]/;

// Resolves the inclusive 1-based column range of the identifier the marker
// column points at, so the underline covers the word rather than whatever
// token the highlighter happened to merge it into.
function wordRange(line, markerColumn) {
  let i = markerColumn - 1;
  if (i < 0) i = 0;
  if (i > line.length - 1) i = line.length - 1;
  if (!WORD.test(line[i]) && i > 0 && WORD.test(line[i - 1])) i--;
  if (!WORD.test(line[i])) return [markerColumn, markerColumn];
  let start = i;
  while (start > 0 && WORD.test(line[start - 1])) start--;
  let end = i;
  while (end < line.length - 1 && WORD.test(line[end + 1])) end++;
  return [start + 1, end + 1];
}

function renderTokens(lines, markerResolver, selectedLine) {
  const totalDigits = String(lines.length).length;
  return lines.map((tokens, i) => {
    const lineno = i + 1;
    const linenoClassName =
      lineno === selectedLine ? 'lineno selected' : 'lineno';
    const line = tokens.map((t) => t.content).join('');
    const parts = [];
    let column = 0;
    for (const token of tokens) {
      const tokenStart = column + 1;
      column += token.content.length;
      // Markers are resolved at the column past the token, matching the
      // position the marker resolver expects (1-based, end of token).
      const marker = markerResolver.resolveMarker({ line: lineno, column });
      const style = token.color ? { color: token.color } : null;
      const text = (content) =>
        style ? <span style={style}>{content}</span> : content;
      if (marker == null) {
        parts.push(text(token.content));
        continue;
      }
      // Underline only the word the marker points at; clicking it jumps to the
      // reason for the highest-severity marker anchored here.
      const [wordStart, wordEnd] = wordRange(line, marker.column);
      const from = Math.max(tokenStart, wordStart) - tokenStart;
      const to = Math.min(column, wordEnd) - tokenStart;
      const className = `marked marked-${marker.severity}${marker.selected ? ' selected' : ''}`;
      const mark = (content) => (
        <a
          href="#"
          class={className}
          data-markerid={marker.id}
          data-markertype={marker.kind}
          data-code-locations={marker.ids.join(' ')}
          style={style}
        >
          {content}
        </a>
      );
      if (to < from) {
        parts.push(mark(token.content));
        continue;
      }
      if (from > 0) parts.push(text(token.content.slice(0, from)));
      parts.push(mark(token.content.slice(from, to + 1)));
      if (to + 1 < token.content.length)
        parts.push(text(token.content.slice(to + 1)));
    }
    return (
      <div class="line" key={lineno}>
        <span class={linenoClassName}>
          {String(lineno).padStart(totalDigits)}:{' '}
        </span>
        <span>{parts}</span>
      </div>
    );
  });
}

export class CodeView extends Component {
  #tokens;
  #tokenizedCode;
  #focusSeq;
  #focusAnimation;

  constructor(props) {
    super(props);
    this.#tokens = null;
    this.#tokenizedCode = null;
    this.#focusSeq = store.locationSeq.value;
    this.#focusAnimation = null;
  }

  #maybeScrollIntoView() {
    const selectedLocation = store.selectedLocation.value;
    if (selectedLocation == null) return;
    const code = document.querySelector(
      `[data-code-locations~="${selectedLocation}"]`,
    );
    if (code == null) return;
    const { top, bottom } = code.getBoundingClientRect();
    const inView = top >= 0 && bottom <= window.innerHeight;
    if (inView) return;
    code.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  #maybeFocusLine() {
    const locationSeq = store.locationSeq.value;
    if (locationSeq === this.#focusSeq) return;
    this.#focusSeq = locationSeq;
    const selectedLine = store.selectedLine.value;
    if (selectedLine == null) return;
    const line = this.base?.querySelectorAll('.line')[selectedLine - 1];
    if (line == null) return;
    // Filth. Needed to cancel animations if you click too fast
    const color = getComputedStyle(line).getPropertyValue('--surface-4');
    if (this.#focusAnimation != null) this.#focusAnimation.cancel();
    this.#focusAnimation = line.animate(
      [{ background: color }, { background: 'transparent' }],
      { duration: 3000, easing: 'ease-out' },
    );
  }

  componentDidMount() {
    this.#loadTokens();
    this.#maybeScrollIntoView();
  }

  #onClick = (event) => {
    const marker = event.target.closest('[data-markerid]');
    if (marker == null) return;
    event.preventDefault();
    event.stopPropagation();
    const { markerid } = marker.dataset;
    this.#onMarkerClicked(parseInt(markerid));
  };

  componentDidUpdate() {
    this.#loadTokens();
    this.#maybeScrollIntoView();
    this.#maybeFocusLine();
  }

  render() {
    const { className = '' } = this.props;
    return (
      <div className={className} onClick={this.#onClick}>
        {this.#renderCode()}
      </div>
    );
  }

  #makeMarkerResolver() {
    const { ics, deopts, codes, icLocations, deoptLocations, codeLocations } =
      store.currentGroup.value;
    return new MarkerResolver({
      deopts,
      deoptLocations,
      ics,
      icLocations,
      codes,
      codeLocations,
      selectedLocation: store.selectedLocation.value,
      includeAllSeverities: store.includeAllSeverities.value,
    });
  }

  async #loadTokens() {
    const fileName = store.selectedFile.value;
    const { src: code } = store.currentGroup.value;
    if (code.length > MAX_HIGHLIGHT_LEN) return;
    if (this.#tokenizedCode === code) return;
    this.#tokenizedCode = code;
    this.#tokens = null;
    try {
      const res = await fetch(
        `/api/tokens?file=${encodeURIComponent(fileName)}`,
      );
      const tokens = await res.json();
      if (this.#tokenizedCode !== code) return;
      this.#tokens = tokens;
      this.forceUpdate();
    } catch {
      // do nothing
    }
  }

  #renderCode() {
    const { src: code } = store.currentGroup.value;
    const selectedLine = store.selectedLine.value;
    const highlight =
      code.length <= MAX_HIGHLIGHT_LEN &&
      this.#tokens != null &&
      this.#tokenizedCode === code;
    if (highlight) {
      try {
        return (
          <div class="pre">
            {renderTokens(
              this.#tokens,
              this.#makeMarkerResolver(),
              selectedLine,
            )}
          </div>
        );
      } catch {
        // Highlighting failed, fall back to marking only
      }
    }
    try {
      return markOnly(code, this.#makeMarkerResolver(), selectedLine);
    } catch {
      // Even marking only failed, just show the code :(
      return (
        <div>
          <p>Deoptigate was unable to highlight/mark the below code</p>
          <pre style={{ whiteSpace: 'pre' }}>{code}</pre>
        </div>
      );
    }
  }

  #onMarkerClicked = (id) => {
    store.selectMarker(id);
  };
}
