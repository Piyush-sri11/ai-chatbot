
import React, { useState, useRef } from 'react';
import { 
  Send, 
  PaperclipIcon, 
  Image,
  File,
  X,
  Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

interface ChatInputProps {
  onSendMessage: (message: string, files?: File[]) => void;
  isLoading: boolean;
  onStopGeneration: () => void;
  modelSupportsImages: boolean;
  modelSupportsFiles: boolean;
  isImageGenerationModel?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  isLoading, 
  onStopGeneration,
  modelSupportsImages,
  modelSupportsFiles,
  isImageGenerationModel = false
}) => {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const handleSend = () => {
    if (!isValidSubmission()) {
      return;
    }
    
    onSendMessage(message, files.length > 0 ? files : undefined);
    setMessage('');
    setFiles([]);
  };
  
  const isValidSubmission = (): boolean => {
    // Message content check
    const hasMessageContent = message.trim().length > 0;
    
    // File validation
    let hasValidFiles = true;
    if (files.length > 0) {
      const hasImages = files.some(file => file.type.startsWith('image/'));
      const hasDocuments = files.some(file => !file.type.startsWith('image/'));
      
      if (hasImages && !modelSupportsImages) {
        toast({
          title: "Images not supported",
          description: "The selected model doesn't support image uploads",
          variant: "destructive"
        });
        hasValidFiles = false;
      }
      
      if (hasDocuments && !modelSupportsFiles) {
        toast({
          title: "Files not supported",
          description: "The selected model doesn't support document uploads",
          variant: "destructive"
        });
        hasValidFiles = false;
      }
    }
    
    return (hasMessageContent || (files.length > 0 && hasValidFiles));
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    if (!modelSupportsFiles && !modelSupportsImages) {
      toast({
        title: "Files not supported",
        description: "The selected model doesn't support file uploads",
        variant: "destructive"
      });
      return;
    }
    
    // Filter files based on model capabilities
    const validFiles = selectedFiles.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isDocument = !isImage;
      
      if (isImage && !modelSupportsImages) {
        toast({
          title: "Images not supported",
          description: "The selected model doesn't support image uploads",
          variant: "destructive"
        });
        return false;
      }
      
      if (isDocument && !modelSupportsFiles) {
        toast({
          title: "Files not supported",
          description: "The selected model doesn't support document uploads",
          variant: "destructive"
        });
        return false;
      }
      
      return true;
    });
    
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
    }
    
    // Reset the input
    e.target.value = '';
  };
  
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {files.map((file, index) => (
            <div 
              key={index}
              className="flex items-center bg-muted rounded-md px-2 py-1"
            >
              {file.type.startsWith('image/') ? (
                <Image size={14} className="mr-1" />
              ) : (
                <File size={14} className="mr-1" />
              )}
              <span className="text-xs truncate max-w-[100px]">
                {file.name}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 ml-1"
                onClick={() => removeFile(index)}
              >
                <X size={12} />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="relative">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isImageGenerationModel ? "Describe the image you want to generate..." : "Type your message..."}
          className="pr-24 resize-none min-h-[60px] max-h-[200px]"
          disabled={isLoading}
          rows={1}
        />
        
        <div className="absolute right-2 bottom-2 flex items-center space-x-1">
          {/* Only show image upload button if model supports images */}
          {!isImageGenerationModel && modelSupportsImages && (
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={isLoading}
              title="Upload image"
            >
              <Image size={18} />
            </Button>
          )}
          
          {/* Only show file upload button if model supports files */}
          {!isImageGenerationModel && modelSupportsFiles && (
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              title="Upload file"
            >
              <PaperclipIcon size={18} />
            </Button>
          )}
          
          <Button
            variant="default"
            size="icon"
            onClick={isLoading ? onStopGeneration : handleSend}
            disabled={!isLoading && !message.trim() && files.length === 0}
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </Button>
        </div>
      </div>
      
      {/* Only render these if the model supports them */}
      {modelSupportsImages && (
        <input
          type="file"
          ref={imageInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          className="hidden"
          multiple
        />
      )}
      
      {modelSupportsFiles && (
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          multiple
        />
      )}
    </div>
  );
};

export default ChatInput;
