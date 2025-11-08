export enum AppFeature {
  MarketingPlanner,
  ChatBot,
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface TourStep {
  target: string;
  title: string;
  content: string;
  action?: () => void;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}