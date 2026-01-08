export enum InsightType {
  GENERAL = 'GENERAL',
  FINANCIAL = 'FINANCIAL',
  INVENTORY = 'INVENTORY',
  ALERT = 'ALERT'
}

export interface ChartData {
  type: 'bar' | 'pie' | 'line';
  title: string;
  data: { name: string; value: number }[];
}

export interface TableData {
  title: string;
  columns: string[];
  rows: { data: string[] }[];
}

export interface TerminalMessage {
  id: string;
  sender: 'user' | 'system';
  text: string;
  timestamp: Date;
  chartData?: ChartData; // Optional chart data attached to the message
  tableData?: TableData; // Optional table data attached to the message
}

export interface BusinessState {
  status: 'IDLE' | 'ANALYZING' | 'VISUALIZING';
  insightType: InsightType;
  confidenceScore: number;
  recordsLoaded: number;
  message?: string;
  chartData?: ChartData; // The AI returns this
  tableData?: TableData; // The AI returns this
}

export const INITIAL_BUSINESS_STATE: BusinessState = {
  status: 'IDLE',
  insightType: InsightType.GENERAL,
  confidenceScore: 0,
  recordsLoaded: 0,
};