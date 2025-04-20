import axios from "axios";
import { AIModel, Message } from "../types";

// Define the possible return types
type AIResponseType = string | { type: 'image', url: string };

// Define the base URL for the backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Send message to AI model via backend
 * @param messages - Conversation history
 * @param model - AI model configuration
 * @param abortController - AbortController for cancelling requests
 * @returns AI response
 */
export const sendMessageToAI = async (
  messages: Message[], 
  model: AIModel, 
  abortController: AbortController
): Promise<AIResponseType> => {
  try {
    // For debugging, log the messages being sent
    console.log("Sending messages to backend:", JSON.stringify(messages, null, 2));
    
    // Handle image generation requests differently
    if (model.isImageGenerator && messages.length > 0) {
      const prompt = messages[messages.length - 1].content;
      
      const response = await axios({
        method: 'post',
        url: `${API_BASE_URL}/generate-image`,
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          prompt,
          model
        },
        signal: abortController.signal
      });
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error("Failed to generate image");
    }
    
    // Regular chat completions
    const response = await axios({
      method: 'post',
      url: `${API_BASE_URL}/chat`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        messages,
        model
      },
      signal: abortController.signal
    });
    
    if (response.data.success) {
      return response.data.data;
    }
    
    throw new Error("Error from backend: " + (response.data.message || "Unknown error"));
    
  } catch (error: any) {
    if (error.name === "AbortError" || error.code === "ECONNABORTED") {
      // Handle abort error
      console.log("Request was aborted");
    } else {
      // Handle other errors
      console.error("API error:", error);
    }
    throw error;
  }
};