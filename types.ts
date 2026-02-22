
export enum PredictionType {
  AI_GENERATED = 'AI_GENERATED',
  HUMAN = 'HUMAN'
}

export interface DetectionResult {
  prediction: PredictionType;
  confidence: number;
  language_detected: string;
  explanation: string;
}

export interface AudioStats {
  duration: number;
  sampleRate: number;
  channels: number;
}
