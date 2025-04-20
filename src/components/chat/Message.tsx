
import React from 'react';
import { Message as MessageType } from '../../types';
import { formatDate, getFileType } from '../../lib/utils';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { Bot, User, Image as ImageIcon } from 'lucide-react';

interface MessageProps {
  message: MessageType;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  const renderFiles = () => {
    if (!message.fileUrls || message.fileUrls.length === 0) return null;
    
    return (
      <div className="mt-3 space-y-2">
        {message.fileUrls.map((fileUrl, index) => {
          const fileName = message.fileNames?.[index] || `File ${index + 1}`;
          const fileType = getFileType(fileName);
          
          if (fileType === 'image') {
            return (
              <div key={index} className="relative group">
                <img 
                  src={fileUrl} 
                  alt={fileName} 
                  className="max-h-60 rounded-md object-contain bg-muted/30"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {fileName}
                </div>
              </div>
            );
          }
          
          return (
            <div 
              key={index} 
              className="flex items-center p-2 bg-muted/30 rounded-md"
            >
              <span className="text-sm truncate">{fileName}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderContent = () => {
    // Handle image content type from DALL-E
    if (message.contentType === 'image' && message.imageUrl) {
      return (
        <div className="mt-3">
          <div className="relative group">
            <img 
              src={message.imageUrl} 
              alt="AI generated image" 
              className="max-w-full rounded-md object-contain bg-muted/30"
            />
            <div className="text-xs text-muted-foreground mt-1">
              AI Generated Image
            </div>
          </div>
        </div>
      );
    }
    
    // Handle regular text content
    if (isUser) {
      return <div className="whitespace-pre-wrap">{message.content}</div>;
    } else {
      return (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              return !className?.includes('language-') ? (
                <code className={className} {...props}>
                  {children}
                </code>
              ) : (
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match?.[1] || ''}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              );
            }
          }}
        >
          {message.content}
        </ReactMarkdown>
      );
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-lg p-4 ${
        isUser 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-secondary text-secondary-foreground'
      }`}>
        <div className="flex items-center mb-2">
          <div className={`p-1.5 rounded-full mr-2 ${
            isUser ? 'bg-primary-foreground/20' : 'bg-secondary-foreground/20'
          }`}>
            {isUser ? (
              <User size={14} />
            ) : message.contentType === 'image' ? (
              <ImageIcon size={14} />
            ) : (
              <Bot size={14} />
            )}
          </div>
          <span className="font-medium">
            {isUser ? 'You' : 'AI Assistant'}
          </span>
          <span className="text-xs opacity-70 ml-2">
            {formatDate(message.timestamp)}
          </span>
        </div>
        
        {renderFiles()}
        
        <div className={`mt-1 ${!isUser ? 'markdown-content' : ''}`}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Message;
