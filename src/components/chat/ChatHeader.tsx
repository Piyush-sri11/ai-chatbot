
import React, { useState } from 'react';
import { 
  MoreVertical, 
  Trash2, 
  Edit2,
  Check,
  X
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { modelGroups, getModelById } from '../../config/models';
import { Chat } from '../../types';

interface ChatHeaderProps {
  chat: Chat;
  onClearChat: () => void;
  onModelChange: (modelId: string) => void;
  onRename: (title: string) => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  chat, 
  onClearChat,
  onModelChange,
  onRename
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(chat.title);
  
  const currentModel = getModelById(chat.modelId);
  
  const handleRename = () => {
    setIsEditing(true);
  };
  
  const handleSave = () => {
    if (title.trim()) {
      onRename(title);
    } else {
      setTitle(chat.title);
    }
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setTitle(chat.title);
    setIsEditing(false);
  };

  const handleModelSelect = (value: string) => {
    onModelChange(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };
  
  return (
    <div className="border-b border-border p-4 flex items-center justify-between bg-background">
      <div className="flex items-center">
        {isEditing ? (
          <div className="flex items-center">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              className="max-w-[240px] h-8"
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-1" 
              onClick={handleSave}
            >
              <Check size={16} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleCancel}
            >
              <X size={16} />
            </Button>
          </div>
        ) : (
          <h2 className="font-semibold text-lg truncate max-w-[240px]">{chat.title}</h2>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Select value={chat.modelId} onValueChange={handleModelSelect}>
          <SelectTrigger className="w-[180px] h-8">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            {modelGroups.map(group => (
              <SelectGroup key={group.provider}>
                <SelectLabel>{group.label}</SelectLabel>
                {group.models.map(model => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical size={18} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Chat Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleRename}>
              <Edit2 size={16} className="mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onClearChat} className="text-destructive">
              <Trash2 size={16} className="mr-2" />
              Clear Messages
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default ChatHeader;
