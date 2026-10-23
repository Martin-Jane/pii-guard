import type { Level, RiskResult } from '../core/types';

export type ScanSummary = {
  host: string;
  trusted: boolean;
  result: RiskResult;
};

export type Msg =
  | { type: 'get-result' }
  | { type: 'badge'; level: Level; count: number };
