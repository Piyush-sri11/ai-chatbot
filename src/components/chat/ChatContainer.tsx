
import React, { useState, useRef, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { addMessage, clearMessages, updateChatModel, renameChat } from '../../store/chatSlice';
import { getModelById } from '../../config/models';
import { sendMessageToAI } from '../../lib/api';
import { createMessage } from '../../lib/utils';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import { useToast } from "@/components/ui/use-toast";
import { fetchImageFromURL } from '../../lib/utils';

// Define interfaces for different response types
interface ImageResponse {
  type: 'image';
  url: string;
}

// Define union type for all possible AI responses
type AIResponse = string | ImageResponse;

const ChatContainer: React.FC = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const chatId = useAppSelector(state => state.chat.activeChat);
  const chats = useAppSelector(state => state.chat.chats);
  const currentChat = chats.find(chat => chat.id === chatId);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false); // New state for AI typing indicator
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Clear abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  if (!currentChat) return null;
  
  const model = getModelById(currentChat.modelId);
  
  const handleSendMessage = async (content: string, files?: File[]) => {
    if (!content.trim() && (!files || files.length === 0)) return;

    // Validate files against model capabilities
    if (files && files.length > 0) {
      const hasImages = files.some(file => file.type.startsWith('image/'));
      const hasDocuments = files.some(file => !file.type.startsWith('image/'));
      
      if ((hasImages && !model?.supportsImages) || (hasDocuments && !model?.supportsFiles)) {
        toast({
          title: "Unsupported files",
          description: `The selected model doesn't support ${!model?.supportsImages ? 'images' : ''}${!model?.supportsImages && !model?.supportsFiles ? ' or ' : ''}${!model?.supportsFiles ? 'documents' : ''}`,
          variant: "destructive"
        });
        return;
      }
    }

    // Create readable file names and convert to data URLs
    const fileUrls: string[] = [];
    const fileNames: string[] = [];
    
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const reader = new FileReader();
          const dataUrl = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          
          fileUrls.push(dataUrl);
          fileNames.push(file.name);
          
          console.log(`File processed: ${file.name}, type: ${file.type}`);
        } catch (error) {
          console.error('Error reading file:', error);
        }
      }
    }
    
    const userMessage = createMessage('user', content, fileUrls, fileNames);
    dispatch(addMessage({ chatId: currentChat.id, message: userMessage }));
    
    // Show what's being sent for debugging
    console.log("Sending message with files:", {
      content,
      fileCount: fileUrls.length, 
      fileTypes: files?.map(f => f.type)
    });
    
    // Send to AI
    try {
      setIsLoading(true);
      setIsAiTyping(true); // Show typing indicator
      
      // Create abort controller for this request
      abortControllerRef.current = new AbortController();
      
      // Pass the full message history including files
      const aiResponse = await sendMessageToAI(
        [...currentChat.messages, userMessage],
        model!,
        abortControllerRef.current
      );
      
      // Handle different response types with proper type checking
      if (typeof aiResponse === 'string') {
        // Regular text response
        const responseMessage = createMessage('assistant', aiResponse);
        dispatch(addMessage({ chatId: currentChat.id, message: responseMessage }));
      } else if (aiResponse && typeof aiResponse === 'object') {
        // Type guard to check if the response is an ImageResponse
        if ('type' in aiResponse && aiResponse.type === 'image' && 'url' in aiResponse) {
          await handleImageResponse(aiResponse.url);
        }
      }
    } catch (error: any) {
      // Only add error message if it wasn't an abort
      if (error.name !== 'AbortError') {
        const errorMessage = createMessage(
          'assistant', 
          `Error: ${error.message || 'Something went wrong'}`
        );
        dispatch(addMessage({ chatId: currentChat.id, message: errorMessage }));
        toast({
          title: "Error",
          description: error.message || "Failed to get response from AI model",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
      setIsAiTyping(false); // Hide typing indicator
      abortControllerRef.current = null;
    }
  };

  const handleImageResponse = async (imageUrl: string) => {
    if (!imageUrl) {
      console.error('No image URL provided');
      return;
    }

    try {
      // Download and convert to data URL for storage in our system
      const dataUrl = await fetchImageFromURL(imageUrl);
      
      // Create a message with the image
      const message = createMessage('assistant', 'Image generated successfully');
      message.contentType = 'image';
      message.imageUrl = dataUrl;
      
      // Add to chat history
      dispatch(addMessage({ chatId: currentChat.id, message }));
    } catch (error: any) {
      console.error('Error processing image:', error);
      const errorMessage = createMessage(
        'assistant',
        `Error processing image: ${error.message || 'Something went wrong'}`
      );
      dispatch(addMessage({ chatId: currentChat.id, message: errorMessage }));
    }
  };
  
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setIsAiTyping(false); // Make sure to reset typing indicator
    }
  };
  
  const handleClearMessages = () => {
    dispatch(clearMessages(currentChat.id));
  };
  
  const handleModelChange = (modelId: string) => {
    dispatch(updateChatModel({ chatId: currentChat.id, modelId }));
  };
  
  const handleRenameChat = (title: string) => {
    dispatch(renameChat({ chatId: currentChat.id, title }));
  };

  return (
    <div className="flex flex-col h-full">
      <ChatHeader 
        chat={currentChat}
        onClearChat={handleClearMessages}
        onModelChange={handleModelChange}
        onRename={handleRenameChat}
      />
      
      <div className="flex-1 overflow-hidden">
        <MessageList messages={currentChat.messages} isTyping={isAiTyping} />
      </div>
      
      <div className="border-t border-border p-4">
        <ChatInput 
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onStopGeneration={handleStopGeneration}
          modelSupportsImages={model?.supportsImages || false}
          modelSupportsFiles={model?.supportsFiles || false}
          isImageGenerationModel={model?.isImageGenerator || false}
        />
      </div>
    </div>
  );
};

export default ChatContainer;
