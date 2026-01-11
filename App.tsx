import React, { useState, useEffect } from 'react';
import DataViewer from './components/DataViewer';
import Terminal from './components/Terminal';
import LoginPage from './components/LoginPage';
import { processCommand } from './services/ai';
import { BusinessState, TerminalMessage, INITIAL_BUSINESS_STATE, InsightType } from './types';
import canvasConfetti from 'canvas-confetti';
import { subscribeToAuth, logoutService, AppUser } from './services/firebase';
import { LogOut } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [businessState, setBusinessState] = useState<BusinessState>(INITIAL_BUSINESS_STATE);
  const [messages, setMessages] = useState<TerminalMessage[]>([
    {
      id: 'init-1',
      sender: 'system',
      text: 'Hello. I am Vernacular Ops. \nUpload your business data (CSV) or ask me anything. \nExample: "Aaj ki sales kaisi rahi?"',
      timestamp: new Date()
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dataContext, setDataContext] = useState<Record<string, string>>({});

  // Auth Listener
  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
      try {
          await logoutService();
      } catch (error) {
          console.error("Logout failed", error);
      }
  };

  const handleFileUpload = (csvData: string, rowCount: number, fileName: string) => {
    setDataContext(prev => ({
      ...prev,
      [fileName]: csvData
    }));

    setBusinessState(prev => ({
        ...prev,
        recordsLoaded: prev.recordsLoaded + rowCount, 
        message: `Loaded ${fileName} successfully.`
    }));
    
    const sysMsg: TerminalMessage = {
        id: Date.now().toString(),
        sender: 'system',
        text: `Data Loaded: ${fileName} \nAdded to context.`,
        timestamp: new Date()
    };
    setMessages(prev => [...prev, sysMsg]);
  };

  const handleRemoveFile = (fileName: string) => {
      setDataContext(prev => {
          const newState = { ...prev };
          delete newState[fileName];
          return newState;
      });

      setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: 'system',
          text: `File removed from context: ${fileName}`,
          timestamp: new Date()
      }]);
  };

  const handleSendCommand = async (commandText: string) => {
    const userMsg: TerminalMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: commandText,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);
    setBusinessState(prev => ({ ...prev, status: 'ANALYZING' }));

    try {
      const newState = await processCommand(commandText, businessState, dataContext);
      
      setBusinessState(newState);

      const sysMsg: TerminalMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'system',
        text: newState.message || "Analysis complete.",
        timestamp: new Date(),
        chartData: newState.chartData, 
        tableData: newState.tableData 
      };
      setMessages(prev => [...prev, sysMsg]);

      if (newState.insightType === InsightType.FINANCIAL && newState.confidenceScore > 80) {
        canvasConfetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#34d399', '#10b981', '#fbbf24']
        });
      }

    } catch (error) {
       console.error(error);
       setMessages(prev => [...prev, {
         id: Date.now().toString(),
         sender: 'system',
         text: 'ERROR: Business logic core unreachable.',
         timestamp: new Date()
       }]);
    } finally {
      setIsProcessing(false);
    }
  };

  if (authLoading) {
      return (
          <div className="h-screen w-screen bg-slate-950 flex items-center justify-center text-slate-500 font-mono">
              INITIALIZING SECURE CONNECTION...
          </div>
      );
  }

  if (!user) {
      return <LoginPage />;
  }

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-white overflow-hidden">
        {/* Left Side - Data Viewer */}
        <div className="w-1/2 h-full p-6 flex flex-col gap-4 relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black -z-10"></div>
            
            <header className="flex justify-between items-start shrink-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white/90">VERNACULAR OPS</h1>
                    <p className="text-indigo-400 text-sm font-mono tracking-wider">DATA INSPECTOR & ANALYTICS</p>
                </div>
                <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-red-400 transition-colors"
                    title="Sign Out"
                >
                    <LogOut className="w-4 h-4" /> SIGN OUT
                </button>
            </header>

            <div className="flex-1 min-h-0 relative">
                <DataViewer files={dataContext} />
            </div>
            
            <div className="grid grid-cols-2 gap-4 shrink-0">
                <div className="bg-slate-900/80 border border-slate-700 p-3 rounded backdrop-blur">
                    <div className="text-xs text-slate-500 font-mono mb-1">USER ID</div>
                    <div className="text-xs font-mono text-emerald-400 truncate">{user.email}</div>
                </div>
                <div className="bg-slate-900/80 border border-slate-700 p-3 rounded backdrop-blur">
                        <div className="text-xs text-slate-500 font-mono mb-1">DATA LAYER</div>
                    <div className="text-xl font-mono text-indigo-400">
                        {Object.keys(dataContext).length > 0 ? 'ACTIVE' : 'AWAITING INPUT'}
                    </div>
                </div>
            </div>
        </div>

        {/* Right Side - Terminal Interface */}
        <div className="w-1/2 h-full">
            <Terminal 
                messages={messages} 
                businessState={businessState} 
                onSendCommand={handleSendCommand}
                onFileUpload={handleFileUpload}
                onRemoveFile={handleRemoveFile}
                isProcessing={isProcessing}
                activeFiles={Object.keys(dataContext)}
            />
        </div>
    </div>
  );
};

export default App;