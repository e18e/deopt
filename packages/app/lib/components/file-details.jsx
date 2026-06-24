import { Component } from 'preact';

import { CodeView } from './code.jsx';
import { SummaryView } from './summary.jsx';

export class FileDetailsView extends Component {
  render() {
    const {
      groups,
      selectedFile,
      selectedLocation,
      locationSeq,
      includeAllSeverities,
      className = '',
      selectedSummaryTabIdx,
      onSummaryClicked,
    } = this.props;

    const {
      ics,
      icLocations,
      deopts,
      deoptLocations,
      codes,
      codeLocations,
      src,
      relativePath,
    } = groups.get(selectedFile);

    return (
      <div className={className}>
        <div className="detail-col">
          <CodeView
            className="code-view"
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
            onMarkerClicked={this.#onMarkerClicked}
          />
        </div>
        <div className="detail-col">
          <SummaryView
            className="summary-view"
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
            onTabHeaderClicked={this.#onSummaryTabHeaderClicked}
            onSummaryClicked={onSummaryClicked}
          />
        </div>
      </div>
    );
  }

  #onMarkerClicked = (id, type) => {
    const { onMarkerClicked, onSummaryTabIdxChanged, selectedSummaryTabIdx } =
      this.props;
    const markerSummaryTabIdx =
      type === 'code'
        ? SummaryView.OPT_TAB_IDX
        : type === 'deopt'
          ? SummaryView.DEOPT_TAB_IDX
          : SummaryView.ICS_TAB_IDX;
    onMarkerClicked(id);
    if (markerSummaryTabIdx !== selectedSummaryTabIdx) {
      onSummaryTabIdxChanged(markerSummaryTabIdx);
    }
  };

  #onSummaryTabHeaderClicked = (idx) => {
    const { onSummaryTabIdxChanged } = this.props;
    onSummaryTabIdxChanged(idx);
  };
}
