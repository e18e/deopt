import { CodeView } from './code.jsx';
import { SummaryView } from './summary.jsx';

export function FileDetailsView({ className = '' }) {
  return (
    <div className={className}>
      <div className="detail-col">
        <CodeView className="code-view" />
      </div>
      <div className="detail-col">
        <SummaryView className="summary-view" />
      </div>
    </div>
  );
}
