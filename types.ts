export interface TimeEntry {
  id: number;
  day: string;
  date: string;
  in1: string;
  out1: string;
  in2: string;
  out2: string;
  break: string;
  hours: string;
  otHours: string;
  sales: string;
  tips: string;
}

export interface TimesheetData {
  employeeName: string;
  payPeriodEnding: string;
  rows: TimeEntry[];
  regHours: string;
  otHours: string;
  totalSales: string;
  totalTips: string;
}

export interface AiReviewResult {
  isValid: boolean;
  message: string;
  correctedTotals?: {
    regHours: number;
    sales: number;
    tips: number;
  }
}