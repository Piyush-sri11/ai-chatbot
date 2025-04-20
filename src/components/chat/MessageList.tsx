
import React, { useRef, useEffect } from 'react';
import { Message as MessageType } from '../../types';
import Message from './Message';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface MessageListProps {
  messages: MessageType[];
  isTyping?: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isTyping = false }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change or when typing indicator appears
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (messages.length === 0 && !isTyping) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium mb-1">Start a conversation</p>
          <p className="text-sm">Send a message to begin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6">
      {messages.map((message, index) => (
        <div
          key={message.id}
          className={cn(
            "transition-opacity",
            index === messages.length - 1 && "animate-fade-in"
          )}
        >
          <Message message={message} />
        </div>
      ))}
      
      {/* AI Typing Indicator */}
      {isTyping && (
        <div className="flex items-center">
          <div className="bg-secondary text-secondary-foreground p-3 rounded-lg max-w-[80%]">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-full bg-secondary-foreground/20">
                <Loader2 size={14} className="animate-spin" />
              </div>
              <span className="text-sm">AI is thinking...</span>
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
