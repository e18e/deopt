import { DeoptProcessor } from './processor.js'
import {
  parseIcState,
  severityIcState
} from './log-processing/ic-state.js';
import {
  nameOptimizationState,
  parseOptimizationState,
  severityOfOptimizationState
} from './log-processing/optimization-state.js';

export async function processLogContent(lines, root) {
  const deoptProcessor = new DeoptProcessor(root)
  for await (const line of lines) {
    await deoptProcessor.processLogLine(line)
  }
  deoptProcessor.filterIcStateChanges()

  return deoptProcessor
}

export {
  DeoptProcessor,
  parseIcState,
  severityIcState,
  nameOptimizationState,
  parseOptimizationState,
  severityOfOptimizationState
};
