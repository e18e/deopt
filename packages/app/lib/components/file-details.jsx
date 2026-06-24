import { Component } from 'preact'

import { CodeView } from './code.jsx'
import { SummaryView } from './summary.jsx'

export class FileDetailsView extends Component {
  constructor(props) {
    super(props)
    this._bind()
  }

  _bind() {
    this._onmarkerClicked = this._onmarkerClicked.bind(this)
    this._onsummaryTabHeaderClicked = this._onsummaryTabHeaderClicked.bind(this)
  }

  render() {
    const {
        groups
      , selectedFile
      , selectedLocation
      , locationSeq
      , includeAllSeverities
      , className = ''
      , selectedSummaryTabIdx
      , onsummaryClicked
    } = this.props

    const {
        ics
      , icLocations
      , deopts
      , deoptLocations
      , codes
      , codeLocations
      , src
      , relativePath
    } = groups.get(selectedFile)

    return (
      <div className={className}>
        <div className='detail-col'>
        <CodeView
          className='code-view'
          selectedLocation={selectedLocation}
          locationSeq={locationSeq}
          fileName={selectedFile}
          code={src}
          ics={ics}
          icLocations={icLocations}
          deopts={deopts}
          deoptLocations={deoptLocations}
          codes={codes}
          codeLocations={codeLocations}
          includeAllSeverities={includeAllSeverities}
          onmarkerClicked={this._onmarkerClicked} />
        </div>
        <div className='detail-col'>
        <SummaryView
          className='summary-view'
          file={selectedFile}
          relativePath={relativePath}
          selectedLocation={selectedLocation}
          ics={ics}
          icLocations={icLocations}
          deopts={deopts}
          deoptLocations={deoptLocations}
          codes={codes}
          codeLocations={codeLocations}
          includeAllSeverities={includeAllSeverities}
          selectedTabIdx={selectedSummaryTabIdx}
          ontabHeaderClicked={this._onsummaryTabHeaderClicked}
          onsummaryClicked={onsummaryClicked} />
        </div>
      </div>
    )
  }

  _onmarkerClicked(id, type) {
    const {
        onmarkerClicked
      , onsummaryTabIdxChanged
      , selectedSummaryTabIdx
    } = this.props
    const markerSummaryTabIdx = (
        type === 'code' ? SummaryView.OPT_TAB_IDX
      : type === 'deopt' ? SummaryView.DEOPT_TAB_IDX
      : SummaryView.ICS_TAB_IDX
    )
    onmarkerClicked(id)
    if (markerSummaryTabIdx !== selectedSummaryTabIdx) {
      onsummaryTabIdxChanged(markerSummaryTabIdx)
    }
  }

  _onsummaryTabHeaderClicked(idx) {
    const { onsummaryTabIdxChanged } = this.props
    onsummaryTabIdxChanged(idx)
  }
}
