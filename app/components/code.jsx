import { Component, Fragment } from 'preact'

import { MarkerResolver } from '../lib/rendering/marker-resolver.jsx'
import { markOnly } from '../lib/rendering/mark-only.jsx'

const MAX_HIGHLIGHT_LEN = 1E5

function renderTokens(lines, markerResolver) {
  const totalDigits = String(lines.length).length
  return lines.map((tokens, i) => {
    const lineno = i + 1
    const parts = []
    let column = 0
    for (const token of tokens) {
      column += token.content.length
      // Markers are resolved at the column past the token, matching the
      // position the marker resolver expects (1-based, end of token).
      const { insertBefore, insertAfter } = markerResolver.resolve({ line: lineno, column })
      parts.push(
        ...insertBefore
      , token.color
          ? <span style={{ color: token.color }}>{token.content}</span>
          : token.content
      , ...insertAfter
      )
    }
    return (
      <Fragment key={lineno}>
        <span>{String(lineno).padStart(totalDigits)}: </span>
        <span>{parts}</span>
        <br />
      </Fragment>
    )
  })
}

export class CodeView extends Component {
  constructor(props) {
    super(props)
    this._bind()
    this._tokens = null
    this._tokenizedCode = null
  }

  _bind() {
    this._onmarkerClicked = this._onmarkerClicked.bind(this)
    this._onclick = this._onclick.bind(this)
  }

  _maybeScrollIntoView() {
    const { selectedLocation } = this.props
    if (selectedLocation == null) return
    const code = document.getElementById(`code-location-${selectedLocation}`)
    if (code == null) return
    const { top, bottom } = code.getBoundingClientRect()
    const inView = top >= 0 && bottom <= window.innerHeight
    if (inView) return
    code.scrollIntoView({ behavior: 'smooth' })
  }

  componentDidMount() {
    this._loadTokens()
    this._maybeScrollIntoView()
  }

  _onclick(event) {
    const marker = event.target.closest('[data-markerid]')
    if (marker == null) return
    event.preventDefault()
    event.stopPropagation()
    const { markerid, markertype } = marker.dataset
    this._onmarkerClicked(parseInt(markerid), markertype)
  }

  componentDidUpdate() {
    this._loadTokens()
    this._maybeScrollIntoView()
  }

  shouldComponentUpdate(nextProps) {
    const props = this.props
    return (
         props.code !== nextProps.code
      || props.selectedLocation !== nextProps.selectedLocation
      || props.includeAllSeverities !== nextProps.includeAllSeverities
      || props.highlightCode !== nextProps.highlightCode
    )
  }

  render() {
    const { className = '' } = this.props
    return (
      <div className={className} onClick={this._onclick}>
        {this._renderCode()}
      </div>
    )
  }

  _makeMarkerResolver() {
    const {
        ics
      , deopts
      , codes
      , icLocations
      , deoptLocations
      , codeLocations
      , selectedLocation
      , includeAllSeverities
    } = this.props
    return new MarkerResolver({
        deopts
      , deoptLocations
      , ics
      , icLocations
      , codes
      , codeLocations
      , selectedLocation
      , includeAllSeverities
    })
  }

  async _loadTokens() {
    const { fileName, code, highlightCode } = this.props
    if (!highlightCode || code.length > MAX_HIGHLIGHT_LEN) return
    if (this._tokenizedCode === code) return
    this._tokenizedCode = code
    this._tokens = null
    try {
      const res = await fetch(`/api/tokens?file=${encodeURIComponent(fileName)}`);
      const tokens = await res.json();
      if (this._tokenizedCode !== code) return
      this._tokens = tokens
      this.forceUpdate()
    } catch {
      // do nothing
    }
  }

  _renderCode() {
    const { code, highlightCode } = this.props
    const highlight =
      highlightCode &&
      code.length <= MAX_HIGHLIGHT_LEN &&
      this._tokens != null &&
      this._tokenizedCode === code
    if (highlight) {
      try {
        return <div class="pre">{renderTokens(this._tokens, this._makeMarkerResolver())}</div>
      } catch (err) {
        // Highlighting failed, fall back to marking only
      }
    }
    try {
      return markOnly(code, this._makeMarkerResolver())
    } catch (err) {
      // Even marking only failed, just show the code :(
      return (
        <div>
          <p>Deoptigate was unable to highlight/mark the below code</p>
          <pre style={{ whiteSpace: 'pre' }}>{code}</pre>
        </div>
      )
    }
  }

  _onmarkerClicked(id, type) {
    const { onmarkerClicked } = this.props
    onmarkerClicked(id, type)
  }
}
