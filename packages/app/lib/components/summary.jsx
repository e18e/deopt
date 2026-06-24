import { Component } from 'preact'

import { MIN_SEVERITY } from '@e18e/deopt-shared'

const severityClassNames = [
    'green i'
  , 'blue'
  , 'red b'
]

const OPT_TAB_IDX = 0
const DEOPT_TAB_IDX = 1
const ICS_TAB_IDX = 2

export class SummaryView extends Component {
  constructor(props) {
    super(props)
    this._bind()
  }

  _bind() {
    this._renderIc = this._renderIc.bind(this)
    this._renderDeopt = this._renderDeopt.bind(this)
    this._renderCode = this._renderCode.bind(this)
  }

  _maybeScrollIntoView() {
    const { selectedLocation } = this.props
    if (selectedLocation == null) return
    const summary = document.getElementById(`summary-location-${selectedLocation}`)
    if (summary == null) return
    const { top, bottom } = summary.getBoundingClientRect()
    const inView = top >= 0 && bottom <= window.innerHeight
    if (inView) return
    summary.scrollIntoView({ behavior: 'smooth' })
  }

  componentDidMount() {
    this._maybeScrollIntoView()
  }

  componentDidUpdate() {
    this._maybeScrollIntoView()
  }

  render() {
    const {
        className = ''
      , ics
      , icLocations
      , deopts
      , deoptLocations
      , codes
      , codeLocations
      , selectedTabIdx
    } = this.props
    const renderedDeopts = this._renderDeopts(deopts, deoptLocations, selectedTabIdx === DEOPT_TAB_IDX)
    const renderedIcs = this._renderIcs(ics, icLocations, selectedTabIdx === ICS_TAB_IDX)
    const renderedCodes = this._renderCodes(codes, codeLocations, selectedTabIdx === OPT_TAB_IDX)
    return (
      <div className={className}>
        <div className='tabs'>
          {this._renderTabHeader('Optimizations', OPT_TAB_IDX)}
          {this._renderTabHeader('Deoptimizations', DEOPT_TAB_IDX)}
          {this._renderTabHeader('Inline Caches', ICS_TAB_IDX)}
        </div>
        <div>
          {renderedCodes}
          {renderedDeopts}
          {renderedIcs}
        </div>
      </div>
    )
  }

  /*
   * Tabs
   */

  _renderTabHeader(label, idx) {
    const { selectedTabIdx } = this.props
    const selected = idx === selectedTabIdx
    const className = selected ? 'tab selected' : 'tab'

    return <a className={className} href='#' onClick={() => this._ontabHeaderClicked(idx)}>{label}</a>
  }

  _renderDataPoint(data, locations, renderDetails) {
    const { selectedLocation, includeAllSeverities, relativePath } = this.props
    if (locations.length === 0) return <p className='summary-empty'>None</p>
    const rendered = []
    for (const loc of locations) {
      const info = data.get(loc)
      if (!includeAllSeverities && info.severity <= MIN_SEVERITY) continue

      const className = selectedLocation === info.id ? 'summary-card selected' : 'summary-card'
      rendered.push(
        <div className={className} key={info.id}>
          {this._summary(info, relativePath)}
          {renderDetails(info)}
        </div>
      )
    }
    return rendered
  }

  _renderIcs(ics, icLocations, selected) {
    if (ics == null || !selected) return null
    return (
      <div key='ics'>
        {this._renderDataPoint(ics, icLocations, this._renderIc)}
      </div>
    )
  }

  _renderDeopts(deopts, deoptLocations, selected) {
    if (deopts == null || !selected) return null
    return (
      <div key='deopts'>
        {this._renderDataPoint(deopts, deoptLocations, this._renderDeopt)}
      </div>
    )
  }

  _renderCodes(codes, codeLocations, selected) {
    if (codes == null || !selected) return null
    return (
      <div key='optimizations'>
        {this._renderDataPoint(codes, codeLocations, this._renderCode)}
      </div>
    )
  }

  _summary(info, relativePath) {
    const {
        id
      , functionName
      , line
      , column
    } = info
    const locationEl = <span className='summary-location'>{id}</span>
    const onclicked = e => {
      e.preventDefault()
      e.stopPropagation()
      this._onsummaryClicked(id)
    }

    const fullLoc = (
      <a href='#'
        className='summary-link'
        onClick={onclicked}>
        {functionName} at {relativePath}:{line}:{column}
      </a>
    )
    return (
      <div id={'summary-location-' + id}>
        {locationEl}
        {fullLoc}
      </div>
    )
  }

  _renderDeopt(info) {
    const rows = info.updates.map((update, idx) => this._deoptRow(update, idx))
    return (
      <table key={'deopt:' + info.id}>
        <thead>
          <tr>
            <td class='col-head'>Timestamp</td>
            <td class='col-head'>Bailout</td>
            <td class='col-head'>Reason</td>
            <td class='col-head'>Inlined</td>
          </tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </table>
    )
  }

  _deoptRow(info) {
    const {
        inlined
      , bailoutType
      , deoptReason
      , timestamp
      , severity
    } = info
    const bailoutClassName = severityClassNames[severity - 1]
    const timeStampMs = (timestamp / 1E3).toFixed()
    return (
      <tr key={timestamp}>
        <td>{timeStampMs}ms</td>
        <td className={bailoutClassName}>{bailoutType}</td>
        <td>{deoptReason}</td>
        <td className='gray'>{inlined ? 'yes' : 'no'}</td>
      </tr>
    )
  }

  _renderIc(info) {
    const rows = info.updates.map((update, idx) => this._icRow(update, idx))
    return (
      <table key={'ic:' + info.id}>
        <thead>
          <tr>
            <td class='col-head'>Old State</td>
            <td class='col-head'>New State</td>
            <td class='col-head'>Key</td>
            <td class='col-head'>Map</td>
          </tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </table>
    )
  }

  _icRow(update, id) {
    const {
        key
      , map
      , oldStateName
      , oldStateSeverity
      , newStateName
      , newStateSeverity
    } = update
    const oldStateClassName = severityClassNames[oldStateSeverity - 1]
    const newStateClassName = severityClassNames[newStateSeverity - 1]

    const mapString = `0x${map}`
    return (
      <tr key={key + id}>
        <td className={oldStateClassName}>{oldStateName}</td>
        <td className={newStateClassName}>{newStateName}</td>
        <td>{key}</td>
        <td className='gray'>{mapString}</td>
      </tr>
    )
  }

  _renderCode(info) {
    const rows = info.updates.map((update, idx) => this._codeRow(update, idx))
    return (
      <table key={'code:' + info.id}>
        <thead>
          <tr>
            <td class='col-head'>Timestamp</td>
            <td class='col-head'>Optimization State</td>
          </tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </table>
    )
  }

  _codeRow(info, id) {
    const { timestamp, stateName, severity } = info
    const timeStampMs = (timestamp / 1E3).toFixed()
    const codeStateClassName = severityClassNames[severity - 1]

    return (
      <tr key={timestamp}>
        <td>{timeStampMs}ms</td>
        <td className={codeStateClassName}>{stateName}</td>
      </tr>
    )
  }

  /*
   * Events
   */
  _ontabHeaderClicked(idx) {
    const { ontabHeaderClicked } = this.props
    ontabHeaderClicked(idx)
  }

  _onsummaryClicked(id) {
    const { onsummaryClicked } = this.props
    onsummaryClicked(id)
  }

  static get OPT_TAB_IDX() { return OPT_TAB_IDX }
  static get DEOPT_TAB_IDX() { return DEOPT_TAB_IDX }
  static get ICS_TAB_IDX() { return ICS_TAB_IDX }
}
