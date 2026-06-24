import { Component } from 'preact'

export class ToolbarView extends Component {
  constructor(props) {
    super(props)
    this._bind()
  }

  _bind() {
    this._onincludeAllSeveritiesToggled = this._onincludeAllSeveritiesToggled.bind(this)
  }

  render() {
    const { className = '' } = this.props
    return (
      <div className={className}>
        {this._renderSeverityOption()}
      </div>
    )
  }

  _renderSeverityOption() {
    const { includeAllSeverities } = this.props
    return (
      <label className='option'>
        Low Severities
        <input
          type='checkbox'
          defaultChecked={!!includeAllSeverities}
          onChange={this._onincludeAllSeveritiesToggled} />
      </label>
    )
  }

  _onincludeAllSeveritiesToggled(e) {
    const { onincludeAllSeveritiesChanged, includeAllSeverities } = this.props
    onincludeAllSeveritiesChanged(!includeAllSeverities)
  }
}
