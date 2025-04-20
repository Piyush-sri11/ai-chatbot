
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  fileUrls?: string[];
  fileNames?: string[];
  contentType?: 'text' | 'image'; // Added for handling different content types
  imageUrl?: string; // For storing image URLs from DALL-E
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  modelId: string;
  createdAt: number;
  updatedAt: number;
  temporary?: boolean; // Add temporary flag
}

export interface AIModel {
  id: string;
  name: string;
  provider: ModelProvider;
  description: string;
  supportsImages: boolean;
  supportsFiles: boolean;
  maxTokens: number;
  apiParam: string;
  isImageGenerator?: boolean; // New flag for image generation models
}

export type ModelProvider = 'openai' | 'llama' | 'gemini' | 'claude';

export interface ProviderGroup {
  provider: ModelProvider;
  label: string;
  models: AIModel[];
}
