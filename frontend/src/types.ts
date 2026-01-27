export enum DocCategory {
  OVERVIEW = 'Overview',
  DEVICES = 'Devices',
  PROTOCOLS = 'Protocols',
  CASE_STUDIES = 'Case Studies',
}

export interface DocSection {
  id: string;
  title: string;
  category: DocCategory;
  content: string;
  diagram?: 'architecture' | 'sensor-fusion';
}

export interface JsonPayload {
  topic: string;
  direction: 'pub' | 'sub';
  payload: Record<string, any>;
  description: string;
}

export interface SequenceStep {
  id: number;
  from: 'Tap' | 'ValveBox' | 'Keg1' | 'Keg2';
  to: 'Tap' | 'ValveBox' | 'Keg1' | 'Keg2';
  action: string;
  payload?: Record<string, any>;
  description: string;
  type: 'mqtt' | 'internal';
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  steps: SequenceStep[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
