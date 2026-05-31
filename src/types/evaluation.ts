import type { Decision } from './shared/decision';
import type { Reason } from './shared/reason';

export interface EvaluationResult {
  decision: Decision;
  reasons: Reason[];
}
