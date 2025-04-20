
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { v4 as uuidv4 } from 'uuid';
import { Chat, Message } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  });
}

export function truncateText(text: string, maxLength: number = 30): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function createNewChat(modelId: string, firstMessage?: string): Chat {
  const now = Date.now();
  const messages: Message[] = [];
  
  if (firstMessage) {
    messages.push({
      id: uuidv4(),
      role: 'user',
      content: firstMessage,
      timestamp: now
    });
  }
  
  return {
    id: uuidv4(),
    title: 'New Chat',
    messages,
    modelId,
    createdAt: now,
    updatedAt: now
  };
}

export function createMessage(
  role: 'user' | 'assistant' | 'system', 
  content: string, 
  fileUrls?: string[], 
  fileNames?: string[]
): Message {
  return {
    id: uuidv4(),
    role,
    content,
    timestamp: Date.now(),
    fileUrls,
    fileNames,
    contentType: 'text' // Default to text
  };
}

export function generateChatTitle(content: string): string {
  // Extract first 5-10 words for the title
  const words = content.split(' ');
  const titleWords = words.slice(0, Math.min(6, words.length));
  let title = titleWords.join(' ');
  
  if (words.length > 6) {
    title += '...';
  }
  
  return title;
}

export function getFileType(fileName: string): 'image' | 'document' | 'unknown' {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
  const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'csv', 'xls', 'xlsx'];
  
  if (imageExtensions.includes(extension)) return 'image';
  if (documentExtensions.includes(extension)) return 'document';
  return 'unknown';
}

export function dataURLtoFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
}

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Helper function to fetch an image from URL and convert to data URL
export async function fetchImageFromURL(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    throw new Error('Failed to fetch image');
  }
}
