
import { AIModel, Message } from "../types";
import axios from "axios";

// Define the possible return types
type AIResponseType = string | { type: 'image', url: string };

const sendToOpenAI = async (messages: Message[], model: AIModel, apiKey: string, abortController: AbortController): Promise<AIResponseType> => {
  try {
    // Transform messages to include image and file content
    const formattedMessages = messages.map(message => {
      // Basic message content
      let formattedMessage: any = {
        role: message.role,
        content: []
      };
      
      // Add text content
      formattedMessage.content.push({
        type: "text",
        text: message.content
      });
      
      // Add image content if available
      if (message.fileUrls && message.fileUrls.length > 0 && message.fileNames) {
        message.fileUrls.forEach((url, index) => {
          if (url.startsWith('data:image/')) {
            formattedMessage.content.push({
              type: "image_url",
              image_url: {
                url: url
              }
            });
          }
        });
      }
      
      // If we only have text and no other content types, simplify the format
      if (formattedMessage.content.length === 1 && formattedMessage.content[0].type === "text") {
        formattedMessage.content = formattedMessage.content[0].text;
      }
      
      return formattedMessage;
    });

    const response = await axios({
      method: 'post',
      url: 'https://api.openai.com/v1/chat/completions',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        model: model.apiParam,
        messages: formattedMessages,
      },
      signal: abortController.signal
    });

    // Handle response
    if (response.data.choices && response.data.choices.length > 0) {
      // Check if this is DALL-E image response
      if (model.isImageGenerator && response.data.data && response.data.data[0] && response.data.data[0].url) {
        return {
          type: 'image',
          url: response.data.data[0].url
        };
      }
      
      // Regular text completion response
      return response.data.choices[0].message?.content || "No response";
    } else {
      throw new Error("No response from OpenAI");
    }
  } catch (error: any) {
    if (error.name === "AbortError" || error.code === "ECONNABORTED") {
      // Handle abort error
      console.log("Request was aborted");
    } else {
      // Handle other errors
      console.error("OpenAI API error:", error);
    }
    throw error;
  }
};

const sendToClaude = async (messages: Message[], modelId: string, abortController: AbortController): Promise<string> => {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("Claude API key is missing. Please set the VITE_ANTHROPIC_API_KEY environment variable.");
  }

  try {
    const claudeMessages = messages.map(message => {
      // Basic message structure
      let formattedMessage: any = {
        role: message.role === 'assistant' ? 'assistant' : 'user',
        content: []
      };
      
      // Add text content
      formattedMessage.content.push({
        type: "text",
        text: message.content
      });
      
      // Add image content if available
      if (message.fileUrls && message.fileUrls.length > 0) {
        message.fileUrls.forEach((url, index) => {
          if (url.startsWith('data:image/')) {
            formattedMessage.content.push({
              type: "image",
              source: {
                type: "base64",
                media_type: url.substring(5, url.indexOf(';base64,')),
                data: url.substring(url.indexOf(',') + 1)
              }
            });
          }
        });
      }
      
      return formattedMessage;
    });

    const response = await axios({
      method: 'post',
      url: 'https://api.anthropic.com/v1/messages',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      data: {
        model: modelId,
        max_tokens: 1024,
        messages: claudeMessages,
        system: "You are a helpful AI assistant."
      },
      signal: abortController.signal
    });

    // Handle claude response - properly access the content
    if (response.data.content && response.data.content.length > 0) {
      const contentBlock = response.data.content[0];
      if (contentBlock && 'text' in contentBlock) {
        return contentBlock.text;
      }
    }
    
    return "No response from Claude";
  } catch (error: any) {
    console.error("Claude API error:", error);
    throw error;
  }
};

// For Llama API integration (add if needed)
const sendToLlama = async (messages: Message[], model: AIModel, abortController: AbortController): Promise<string> => {
  const apiKey = import.meta.env.VITE_LLAMA_API_KEY;
  
  if (!apiKey) {
    throw new Error("Llama API key is missing. Please set the VITE_LLAMA_API_KEY environment variable.");
  }
  
  try {
    // Format messages for Llama API
    const formattedMessages = messages.map(message => {
      return {
        role: message.role,
        content: message.content
      };
    });
    
    const response = await axios({
      method: 'post',
      url: 'https://api.llama-api.com/chat/completions', // Replace with actual Llama API URL
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        model: model.apiParam,
        messages: formattedMessages,
        max_tokens: model.maxTokens,
      },
      signal: abortController.signal
    });

    return response.data.choices[0].message.content || "No response from Llama";
  } catch (error: any) {
    console.error("Llama API error:", error);
    throw error;
  }
};

// For Gemini API integration (add if needed)
const sendToGemini = async (messages: Message[], model: AIModel, abortController: AbortController): Promise<string> => {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  
  if (!apiKey) {
    throw new Error("Google API key is missing. Please set the VITE_GOOGLE_API_KEY environment variable.");
  }
  
  try {
    // Format messages for Gemini API with proper handling for images
    const formattedMessages = messages.map(message => {
      let content = [];
      
      // Add text content
      content.push({ text: message.content });
      
      // Add image content if available
      if (message.fileUrls && message.fileUrls.length > 0) {
        message.fileUrls.forEach((url) => {
          if (url.startsWith('data:image/')) {
            const mimeType = url.substring(5, url.indexOf(';base64,'));
            const base64Data = url.substring(url.indexOf(',') + 1);
            content.push({
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            });
          }
        });
      }
      
      return {
        role: message.role === 'assistant' ? 'model' : message.role,
        parts: content
      };
    });
    
    const response = await axios({
      method: 'post',
      url: `https://generativelanguage.googleapis.com/v1beta/models/${model.apiParam}:generateContent`,
      params: { key: apiKey },
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        contents: formattedMessages,
        generationConfig: {
          maxOutputTokens: model.maxTokens
        }
      },
      signal: abortController.signal
    });

    if (response.data.candidates && response.data.candidates.length > 0 &&
        response.data.candidates[0].content && 
        response.data.candidates[0].content.parts &&
        response.data.candidates[0].content.parts.length > 0) {
      return response.data.candidates[0].content.parts[0].text || "No response from Gemini";
    }
    
    return "No response from Gemini";
  } catch (error: any) {
    console.error("Gemini API error:", error);
    throw error;
  }
};

// Implementation for DALL-E API call
const generateImageWithDallE = async (prompt: string, model: AIModel, apiKey: string, abortController: AbortController): Promise<{type: 'image', url: string}> => {
  try {
    const response = await axios({
      method: 'post',
      url: 'https://api.openai.com/v1/images/generations',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        model: model.apiParam,
        prompt: prompt,
        n: 1,
        size: "1024x1024",
      },
      signal: abortController.signal
    });

    if (response.data.data && response.data.data.length > 0 && response.data.data[0].url) {
      return {
        type: 'image',
        url: response.data.data[0].url
      };
    }
    
    throw new Error("Failed to generate image with DALL-E");
  } catch (error: any) {
    console.error("DALL-E API error:", error);
    throw error;
  }
};

export const sendMessageToAI = async (messages: Message[], model: AIModel, abortController: AbortController): Promise<AIResponseType> => {
  try {
    // For debugging, log the messages being sent
    console.log("Sending messages to AI:", JSON.stringify(messages, null, 2));
    
    switch (model.provider) {
      case "openai":
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) {
          throw new Error("OpenAI API key is missing. Please set the VITE_OPENAI_API_KEY environment variable.");
        }
        
        // Handle image generation models separately
        if (model.isImageGenerator && messages.length > 0) {
          const prompt = messages[messages.length - 1].content;
          return await generateImageWithDallE(prompt, model, apiKey, abortController);
        }
        
        return await sendToOpenAI(messages, model, apiKey, abortController);
        
      case "claude":
        return await sendToClaude(messages, model.apiParam, abortController);
        
      case "llama":
        return await sendToLlama(messages, model, abortController);
        
      case "gemini":
        return await sendToGemini(messages, model, abortController);
        
      default:
        throw new Error(`Unsupported model provider: ${model.provider}`);
    }
  } catch (error: any) {
    console.error("Error in sendMessageToAI:", error);
    throw error;
  }
};
