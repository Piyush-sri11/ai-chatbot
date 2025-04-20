
import React from 'react';
import Sidebar from './Sidebar';
import ChatContainer from '../chat/ChatContainer';
import { useAppSelector } from '../../hooks/redux';
import { Clock } from 'lucide-react';

const MainLayout: React.FC = () => {
  const activeChat = useAppSelector(state => state.chat.activeChat);
  const isLoading = useAppSelector(state => state.chat.isLoading);
  const temporaryMode = useAppSelector(state => state.chat.temporaryMode);
  const temporaryChatActive = useAppSelector(state => state.chat.temporaryChatActive);
  
  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-xl font-medium mb-4 text-foreground">Loading chats from MongoDB...</h2>
              <div className="animate-pulse mt-4">
                <div className="h-2 bg-muted rounded w-48 mx-auto mb-2"></div>
                <div className="h-2 bg-muted rounded w-32 mx-auto"></div>
              </div>
            </div>
          </div>
        ) : activeChat ? (
          <>
            {temporaryMode && temporaryChatActive && (
              <div className="bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 py-2 px-4 text-sm flex items-center justify-center">
                <Clock size={14} className="mr-2" /> 
                Temporary chat mode active — This conversation will not be saved to the database
              </div>
            )}
            <ChatContainer />
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4 text-foreground">Welcome to Anurag Singh</h2>
              <p className="text-muted-foreground mb-8">Start a new chat to begin conversing with AI models</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainLayout;
