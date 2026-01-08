import React, { useState, useEffect } from 'react';
import Scene from './components/Scene';
import Terminal from './components/Terminal';
import { processCommand } from './services/ai';
import { BusinessState, TerminalMessage, INITIAL_BUSINESS_STATE, InsightType } from './types';
import canvasConfetti from 'canvas-confetti';

const App: React.FC = () => {
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
  // Store multiple files: Key = filename, Value = content
  const [dataContext, setDataContext] = useState<Record<string, string>>({});

  // Handle File Upload from Terminal
  const handleFileUpload = (csvData: string, rowCount: number, fileName: string) => {
    setDataContext(prev => ({
      ...prev,
      [fileName]: csvData
    }));

    setBusinessState(prev => ({
        ...prev,
        recordsLoaded: prev.recordsLoaded + rowCount, // Accumulate count
        message: `Loaded ${fileName} successfully.`
    }));
    
    const sysMsg: TerminalMessage = {
        id: Date.now().toString(),
        sender: 'system',
        text: `Data Loaded: ${fileName} \nAdded to context. You can now compare this with other files.`,
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
    // Add User Message
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
      // Connect to AI Analyst with ALL loaded files
      const newState = await processCommand(commandText, businessState, dataContext);
      
      setBusinessState(newState);

      // Add System Response with Chart/Table Data if available
      const sysMsg: TerminalMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'system',
        text: newState.message || "Analysis complete.",
        timestamp: new Date(),
        chartData: newState.chartData, // Pass the chart data to the message
        tableData: newState.tableData  // Pass the table data to the message
      };
      setMessages(prev => [...prev, sysMsg]);

      // Trigger visual effect on positive financial news
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
         text: 'ERROR: I am having trouble connecting to the business logic core.',
         timestamp: new Date()
       }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-white overflow-hidden">
        {/* Left Side - 3D Visualizer */}
        <div className="w-1/2 h-full p-6 flex flex-col gap-6 relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black -z-10"></div>
            
            <header className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight text-white/90">VERNACULAR OPS</h1>
                <p className="text-indigo-400 text-sm font-mono tracking-wider">BUSINESS INTELLIGENCE & ANALYTICS</p>
            </header>

            <div className="flex-1 relative">
                <Scene businessState={businessState} />
                
                {/* Overlay Stats for Visualizer */}
                <div className="absolute bottom-6 left-6 right-6 grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/80 border border-slate-700 p-4 rounded backdrop-blur">
                        <div className="text-xs text-slate-500 font-mono mb-1">DATA INTEGRITY</div>
                        <div className="text-2xl font-mono text-emerald-400">SECURE</div>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-700 p-4 rounded backdrop-blur">
                         <div className="text-xs text-slate-500 font-mono mb-1">TRANSLATION LAYER</div>
                        <div className="text-2xl font-mono text-indigo-400">ACTIVE</div>
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