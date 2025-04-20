
import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { addChat, deleteChat, setActiveChat, renameChat, setTemporaryMode } from '../../store/chatSlice';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { 
  PlusCircle, 
  MessageCircle, 
  Trash2, 
  Edit2, 
  Check, 
  X,
  Database,
  Clock,
  Lock
} from 'lucide-react';
import { truncateText, formatDate } from '../../lib/utils';
import { defaultModelId } from '../../config/models';

const Sidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { chats, activeChat, temporaryMode, isLoading, temporaryChatActive } = useAppSelector(state => state.chat);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  
  const handleNewChat = () => {
    dispatch(addChat({ modelId: defaultModelId }));
  };
  
  const handleChatClick = (chatId: string) => {
    dispatch(setActiveChat(chatId));
  };
  
  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(deleteChat(chatId));
  };
  
  const handleStartRename = (chatId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(chatId);
    setEditTitle(currentTitle);
  };
  
  const handleSaveRename = (chatId: string, e?: React.MouseEvent | React.FormEvent) => {
    e?.preventDefault();
    if (e) e.stopPropagation();
    
    if (editTitle.trim()) {
      dispatch(renameChat({ chatId, title: editTitle }));
    }
    
    setEditingChatId(null);
  };
  
  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(null);
  };

  const handleToggleTemporaryMode = () => {
    dispatch(setTemporaryMode(!temporaryMode));
  };

  // Check if actions are disabled (when in temporary chat mode)
  const actionsDisabled = temporaryMode && temporaryChatActive;

  return (
    <div className="w-64 h-full bg-muted/20 border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <h1 className="font-bold text-lg mb-4">Anurag Singh</h1>
        <Button 
          onClick={handleNewChat} 
          className="w-full flex items-center justify-center gap-2 mb-4"
          disabled={isLoading || actionsDisabled}
        >
          <PlusCircle size={16} /> New Chat
        </Button>
        
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 text-sm">
            <Switch 
              checked={temporaryMode} 
              onCheckedChange={handleToggleTemporaryMode} 
              id="temporary-mode"
            />
            <label htmlFor="temporary-mode" className="cursor-pointer">
              Temporary Chat
            </label>
          </div>
        </div>
        <div className="text-xs text-muted-foreground mb-2">
          {temporaryMode ? (
            <p className="flex items-center gap-1">
              {temporaryChatActive && <Lock size={12} className="text-amber-500" />}
              <Clock size={12} /> Not stored in database
              {temporaryChatActive && <span className="ml-1 text-amber-500">(Chat switching disabled)</span>}
            </p>
          ) : (
            <p className="flex items-center gap-1">
              <Database size={12} /> Stored in MongoDB
            </p>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">
            <p>Loading chats...</p>
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>No chats yet</p>
            <p className="text-sm">Click "New Chat" to start</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {chats.map(chat => {
              // If in temporary mode with active temporary chat, only show temp chat and disable others
              if (actionsDisabled && !chat.temporary) {
                return null;
              }
              
              return (
                <li key={chat.id}>
                  <div 
                    className={`flex items-center rounded-md p-2 ${
                      actionsDisabled && !chat.temporary ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                    } group hover:bg-accent ${
                      chat.id === activeChat ? 'bg-accent' : ''
                    }`}
                    onClick={() => !actionsDisabled && handleChatClick(chat.id)}
                  >
                    <div className="mr-2 flex-shrink-0">
                      {chat.temporary ? (
                        <Clock size={16} className="text-muted-foreground" />
                      ) : (
                        <MessageCircle size={16} />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {editingChatId === chat.id ? (
                        <form onSubmit={(e) => handleSaveRename(chat.id, e)} className="flex items-center">
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                            className="h-6 py-1"
                          />
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={(e) => handleSaveRename(chat.id, e)}
                          >
                            <Check size={14} />
                          </Button>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={handleCancelRename}
                          >
                            <X size={14} />
                          </Button>
                        </form>
                      ) : (
                        <>
                          <div className="text-sm truncate">{truncateText(chat.title)}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(chat.updatedAt)}
                          </div>
                        </>
                      )}
                    </div>
                    
                    {!editingChatId && !actionsDisabled && (
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => handleStartRename(chat.id, chat.title, e)}
                          disabled={actionsDisabled}
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-destructive hover:text-destructive/90"
                          onClick={(e) => handleDeleteChat(chat.id, e)}
                          disabled={actionsDisabled}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
