
export interface PrescriptionData {
  patientName: string;
  diagnosis: string;
  treatment: string;
  advice: string;
  userImage?: string;
  template?: PrescriptionTemplate;
}

export interface CardPosition {
  x: number;
  y: number;
}

export type PrescriptionTemplate = 'classic' | 'royal' | 'aged' | 'minimalist' | 'lab' | 'prestige' | 'glass' | 'dark_modern';

export type BackgroundType = 'wood' | 'marble' | 'dark' | 'felt' | 'leather' | 'concrete' | 'linen' | 'silk' | 'starry';

export type AIPersona = 'gentle' | 'professional' | 'witty' | 'ancient';

export interface AppSettings {
  background: BackgroundType;
  soundEnabled: boolean;
  aiPersona: AIPersona;
  template: PrescriptionTemplate;
}

export interface PrescriptionCardType {
  id: string;
  data: PrescriptionData;
  position: CardPosition;
  rotation: number;
  timestamp: number;
  isTypingComplete: boolean;
  userImage?: string;
  scale?: number;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  data: PrescriptionData;
}

export interface Attachment {
  type: 'image' | 'video' | 'audio';
  url: string; // For preview
  base64: string; // For API
  mimeType: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  attachments?: Attachment[];
  suggestions?: string[]; // Suggested follow-up questions
}

export type AppMode = 'quick' | 'consultation';
