
// Import polyfills first
import './polyfills';

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./store";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import MainLayout from "./components/layout/MainLayout";
import { useEffect } from "react";
import { useAppDispatch } from "./hooks/redux";
import { loadChatsFromMongoDB, setIsLoading, clearTemporaryChats } from "./store/chatSlice";
import mongoDBService from "./services/mongoDBService";

const queryClient = new QueryClient();

const AppContent = () => {
  const dispatch = useAppDispatch();

  // Clear temporary chats on app initialization
  useEffect(() => {
    dispatch(clearTemporaryChats());
  }, [dispatch]);

  // Load chats from MongoDB on app startup
  useEffect(() => {
    const loadChats = async () => {
      dispatch(setIsLoading(true));
      try {
        const initialized = await mongoDBService.initialize();
        if (initialized) {
          const chats = await mongoDBService.getChats();
          dispatch(loadChatsFromMongoDB(chats));
        }
      } catch (error) {
        console.error("Failed to load chats from MongoDB:", error);
      } finally {
        dispatch(setIsLoading(false));
      }
    };

    loadChats();
  }, [dispatch]);

  return <MainLayout />;
};

const App = () => (
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </TooltipProvider>
      </QueryClientProvider>
    </PersistGate>
  </Provider>
);

export default App;
