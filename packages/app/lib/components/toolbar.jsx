import { Component } from 'preact';

export class ToolbarView extends Component {
  render() {
    const { className = '' } = this.props;
    return <div className={className}>{this.#renderSeverityOption()}</div>;
  }

  #renderSeverityOption() {
    const { includeAllSeverities } = this.props;
    return (
      <label className="option">
        Low Severities
        <input
          type="checkbox"
          defaultChecked={!!includeAllSeverities}
          onChange={this.#onIncludeAllSeveritiesToggled}
        />
      </label>
    );
  }

  #onIncludeAllSeveritiesToggled = () => {
    const { onIncludeAllSeveritiesChanged, includeAllSeverities } = this.props;
    onIncludeAllSeveritiesChanged(!includeAllSeverities);
  };
}
