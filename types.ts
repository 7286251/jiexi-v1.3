
export interface ParseResult {
  content: string;
  beautified: boolean;
  language: 'zh' | 'en';
}

export enum AppStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  ANALYZING = 'ANALYZING',
  MODIFYING = 'MODIFYING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
