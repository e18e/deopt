import { Component } from 'preact';

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

function renderTokens(lines, markerResolver) {
  const totalDigits = String(lines.length).length;
  return lines.map((tokens, i) => {
    const lineno = i + 1;
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
        <span>{String(lineno).padStart(totalDigits)}: </span>
        <span>{parts}</span>
      </div>
    );
  });
}

export class CodeView extends Component {
  constructor(props) {
    super(props);
    this._bind();
    this._tokens = null;
    this._tokenizedCode = null;
    this._focusSeq = props.locationSeq;
    this._focusAnimation = null;
  }

  _bind() {
    this._onmarkerClicked = this._onmarkerClicked.bind(this);
    this._onclick = this._onclick.bind(this);
  }

  _maybeScrollIntoView() {
    const { selectedLocation } = this.props;
    if (selectedLocation == null) return;
    const code = document.querySelector(
      `[data-code-locations~="${selectedLocation}"]`,
    );
    if (code == null) return;
    const { top, bottom } = code.getBoundingClientRect();
    const inView = top >= 0 && bottom <= window.innerHeight;
    if (inView) return;
    code.scrollIntoView({ behavior: 'smooth' });
  }

  _maybeFocusLine() {
    const { selectedLocation, locationSeq } = this.props;
    if (locationSeq === this._focusSeq) return;
    this._focusSeq = locationSeq;
    if (selectedLocation == null) return;
    const marker = document.querySelector(
      `[data-code-locations~="${selectedLocation}"]`,
    );
    if (marker == null) return;
    const line = marker.closest('.line');
    if (line == null) return;
    // Filth. Needed to cancel animations if you click too fast
    const color = getComputedStyle(line).getPropertyValue('--surface-4');
    if (this._focusAnimation != null) this._focusAnimation.cancel();
    this._focusAnimation = line.animate(
      [{ background: color }, { background: 'transparent' }],
      { duration: 3000, easing: 'ease-out' },
    );
  }

  componentDidMount() {
    this._loadTokens();
    this._maybeScrollIntoView();
  }

  _onclick(event) {
    const marker = event.target.closest('[data-markerid]');
    if (marker == null) return;
    event.preventDefault();
    event.stopPropagation();
    const { markerid, markertype } = marker.dataset;
    this._onmarkerClicked(parseInt(markerid), markertype);
  }

  componentDidUpdate() {
    this._loadTokens();
    this._maybeScrollIntoView();
    this._maybeFocusLine();
  }

  shouldComponentUpdate(nextProps) {
    const props = this.props;
    return (
      props.code !== nextProps.code ||
      props.selectedLocation !== nextProps.selectedLocation ||
      props.locationSeq !== nextProps.locationSeq ||
      props.includeAllSeverities !== nextProps.includeAllSeverities
    );
  }

  render() {
    const { className = '' } = this.props;
    return (
      <div className={className} onClick={this._onclick}>
        {this._renderCode()}
      </div>
    );
  }

  _makeMarkerResolver() {
    const {
      ics,
      deopts,
      codes,
      icLocations,
      deoptLocations,
      codeLocations,
      selectedLocation,
      includeAllSeverities,
    } = this.props;
    return new MarkerResolver({
      deopts,
      deoptLocations,
      ics,
      icLocations,
      codes,
      codeLocations,
      selectedLocation,
      includeAllSeverities,
    });
  }

  async _loadTokens() {
    const { fileName, code } = this.props;
    if (code.length > MAX_HIGHLIGHT_LEN) return;
    if (this._tokenizedCode === code) return;
    this._tokenizedCode = code;
    this._tokens = null;
    try {
      const res = await fetch(
        `/api/tokens?file=${encodeURIComponent(fileName)}`,
      );
      const tokens = await res.json();
      if (this._tokenizedCode !== code) return;
      this._tokens = tokens;
      this.forceUpdate();
    } catch {
      // do nothing
    }
  }

  _renderCode() {
    const { code } = this.props;
    const highlight =
      code.length <= MAX_HIGHLIGHT_LEN &&
      this._tokens != null &&
      this._tokenizedCode === code;
    if (highlight) {
      try {
        return (
          <div class="pre">
            {renderTokens(this._tokens, this._makeMarkerResolver())}
          </div>
        );
      } catch (err) {
        // Highlighting failed, fall back to marking only
      }
    }
    try {
      return markOnly(code, this._makeMarkerResolver());
    } catch (err) {
      // Even marking only failed, just show the code :(
      return (
        <div>
          <p>Deoptigate was unable to highlight/mark the below code</p>
          <pre style={{ whiteSpace: 'pre' }}>{code}</pre>
        </div>
      );
    }
  }

  _onmarkerClicked(id, type) {
    const { onmarkerClicked } = this.props;
    onmarkerClicked(id, type);
  }
}
