
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { Chat, Message } from '../types';
import { getModelById, defaultModelId } from '../config/models';
import { generateChatTitle } from '../lib/utils';
import mongoDBService from '../services/mongoDBService';

interface ChatState {
  chats: Chat[];
  activeChat: string | null;
  temporaryMode: boolean;
  isLoading: boolean;
  temporaryChatActive: boolean; // Track if we're in a temporary chat session
}

const initialState: ChatState = {
  chats: [],
  activeChat: null,
  temporaryMode: false,
  isLoading: false,
  temporaryChatActive: false // Initially not in temporary chat mode
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setTemporaryMode: (state, action: PayloadAction<boolean>) => {
      state.temporaryMode = action.payload;
      
      // When enabling temporary mode, if there's no active temporary chat, create one
      if (action.payload && !state.temporaryChatActive) {
        state.temporaryChatActive = true;
        
        // Create a new temporary chat if needed
        if (!state.chats.some(chat => chat.temporary)) {
          const now = Date.now();
          const newChat: Chat = {
            id: uuidv4(),
            title: 'Temporary Chat',
            messages: [],
            modelId: defaultModelId,
            createdAt: now,
            updatedAt: now,
            temporary: true
          };
          
          state.chats.unshift(newChat);
          state.activeChat = newChat.id;
        } else {
          // Find the first temporary chat and set it as active
          const tempChat = state.chats.find(chat => chat.temporary);
          if (tempChat) {
            state.activeChat = tempChat.id;
          }
        }
      }
      
      // When disabling temporary mode, reset the flag
      if (!action.payload) {
        state.temporaryChatActive = false;
      }
    },
    
    clearTemporaryChats: (state) => {
      // Remove all temporary chats
      state.chats = state.chats.filter(chat => !chat.temporary);
      
      // Reset temporary mode flags
      state.temporaryChatActive = false;
      
      // If active chat was temporary, set to first non-temporary chat or null
      if (state.activeChat && !state.chats.find(chat => chat.id === state.activeChat)) {
        state.activeChat = state.chats.length > 0 ? state.chats[0].id : null;
      }
    },
    
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    addChat: (state, action: PayloadAction<{ modelId?: string, initialMessage?: string }>) => {
      // Don't allow new chats in temporary mode with active temporary chat
      if (state.temporaryMode && state.temporaryChatActive) return;
      
      const { modelId = defaultModelId, initialMessage } = action.payload;
      const now = Date.now();
      let newChat: Chat = {
        id: uuidv4(),
        title: 'New Chat',
        messages: [],
        modelId,
        createdAt: now,
        updatedAt: now,
        temporary: state.temporaryMode
      };

      if (initialMessage) {
        const msgId = uuidv4();
        newChat.messages.push({
          id: msgId,
          role: 'user',
          content: initialMessage,
          timestamp: now
        });
        
        newChat.title = generateChatTitle(initialMessage);
      }

      state.chats.unshift(newChat);
      state.activeChat = newChat.id;
      
      // Save to MongoDB if not in temporary mode
      if (!state.temporaryMode) {
        mongoDBService.saveChat(newChat).catch(err => {
          console.error("Failed to save chat to MongoDB:", err);
        });
      }
    },
    
    loadChatsFromMongoDB: (state, action: PayloadAction<Chat[]>) => {
      // Replace local chats with those from MongoDB
      state.chats = action.payload;
      // If there are chats, set the active chat to the first one
      if (action.payload.length > 0) {
        state.activeChat = action.payload[0].id;
      }
    },
    
    deleteChat: (state, action: PayloadAction<string>) => {
      const index = state.chats.findIndex(chat => chat.id === action.payload);
      
      if (index !== -1) {
        const isTemporary = state.chats[index].temporary;
        state.chats.splice(index, 1);
        
        // Update active chat if needed
        if (state.activeChat === action.payload) {
          state.activeChat = state.chats.length > 0 ? state.chats[0].id : null;
        }
        
        // Delete from MongoDB if not temporary
        if (!isTemporary) {
          mongoDBService.deleteChat(action.payload).catch(err => {
            console.error("Failed to delete chat from MongoDB:", err);
          });
        }
      }
    },
    
    setActiveChat: (state, action: PayloadAction<string>) => {
      // Don't allow changing active chat in temporary mode
      if (state.temporaryMode && state.temporaryChatActive) return;
      
      state.activeChat = action.payload;
    },
    
    addMessage: (state, action: PayloadAction<{chatId: string, message: Message}>) => {
      const { chatId, message } = action.payload;
      const chat = state.chats.find(chat => chat.id === chatId);
      
      if (chat) {
        chat.messages.push(message);
        chat.updatedAt = Date.now();
        
        // Update title if this is the first user message and chat has default title
        if (message.role === 'user' && chat.messages.length === 1 && chat.title === 'New Chat') {
          chat.title = generateChatTitle(message.content);
        }
        
        // Save chat to MongoDB if not temporary
        if (!chat.temporary) {
          mongoDBService.saveChat(chat).catch(err => {
            console.error("Failed to save message to MongoDB:", err);
          });
        }
      }
    },
    
    renameChat: (state, action: PayloadAction<{chatId: string, title: string}>) => {
      const { chatId, title } = action.payload;
      const chat = state.chats.find(chat => chat.id === chatId);
      
      if (chat) {
        chat.title = title;
        
        // Update in MongoDB if not temporary
        if (!chat.temporary) {
          mongoDBService.saveChat(chat).catch(err => {
            console.error("Failed to update chat title in MongoDB:", err);
          });
        }
      }
    },
    
    updateChatModel: (state, action: PayloadAction<{chatId: string, modelId: string}>) => {
      const { chatId, modelId } = action.payload;
      const chat = state.chats.find(chat => chat.id === chatId);
      
      if (chat) {
        chat.modelId = modelId;
        
        // Update in MongoDB if not temporary
        if (!chat.temporary) {
          mongoDBService.saveChat(chat).catch(err => {
            console.error("Failed to update chat model in MongoDB:", err);
          });
        }
      }
    },
    
    clearMessages: (state, action: PayloadAction<string>) => {
      const chat = state.chats.find(chat => chat.id === action.payload);
      
      if (chat) {
        chat.messages = [];
        chat.updatedAt = Date.now();
        
        // Update in MongoDB if not temporary
        if (!chat.temporary) {
          mongoDBService.saveChat(chat).catch(err => {
            console.error("Failed to clear messages in MongoDB:", err);
          });
        }
      }
    }
  }
});

export const { 
  addChat, 
  deleteChat, 
  setActiveChat, 
  addMessage, 
  renameChat,
  updateChatModel,
  clearMessages,
  setTemporaryMode,
  loadChatsFromMongoDB,
  setIsLoading,
  clearTemporaryChats
} = chatSlice.actions;

export default chatSlice.reducer;
