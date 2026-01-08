import React, { useState, useEffect, useRef } from 'react';
import { TerminalMessage, BusinessState, InsightType, ChartData, TableData } from '../types';
import { Send, Terminal as TerminalIcon, FileSpreadsheet, BarChart3, Database, AlertCircle, Paperclip, Mic, MicOff, X, Table as TableIcon } from 'lucide-react';
import Papa from 'papaparse';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

interface TerminalProps {
  messages: TerminalMessage[];
  businessState: BusinessState;
  onSendCommand: (command: string) => void;
  onFileUpload: (data: string, rowCount: number, fileName: string) => void;
  onRemoveFile: (fileName: string) => void;
  isProcessing: boolean;
  activeFiles: string[];
}

const Terminal: React.FC<TerminalProps> = ({ messages, businessState, onSendCommand, onFileUpload, onRemoveFile, isProcessing, activeFiles }) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onSendCommand(input);
      setInput('');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        preview: 50, // Limit context for AI
        complete: (results) => {
          const csvString = Papa.unparse(results.data);
          onFileUpload(csvString, 1000, file.name); 
          // Reset input so same file can be selected again if needed
          if (fileInputRef.current) fileInputRef.current.value = '';
        },
        error: (error) => {
          console.error("CSV Error:", error);
        }
      });
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN'; 
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join('');
        setInput(transcript);
    };

    recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
    };

    recognition.onend = () => {
        setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const getStatusColor = (type: InsightType) => {
    switch (type) {
      case InsightType.FINANCIAL: return 'text-emerald-400';
      case InsightType.INVENTORY: return 'text-blue-400';
      case InsightType.ALERT: return 'text-red-500 animate-pulse';
      default: return 'text-slate-400';
    }
  };

  const renderChart = (chartData: ChartData) => {
    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    
    return (
      <div className="mt-4 p-4 bg-slate-900 rounded-lg border border-slate-700 w-full h-[300px]">
        <h4 className="text-xs font-mono text-slate-400 mb-2 uppercase text-center flex items-center justify-center gap-2">
            <BarChart3 className="w-4 h-4" /> {chartData.title}
        </h4>
        <ResponsiveContainer width="100%" height="90%">
          {chartData.type === 'bar' ? (
            <BarChart data={chartData.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc' }}
                itemStyle={{ color: '#f8fafc' }}
              />
              <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : chartData.type === 'line' ? (
             <LineChart data={chartData.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc' }} 
              />
              <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={{r: 4}} />
            </LineChart>
          ) : (
            <PieChart>
                <Pie
                    data={chartData.data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                >
                    {chartData.data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc' }} />
                <Legend />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  };

  const renderTable = (tableData: TableData) => {
    return (
        <div className="mt-4 w-full overflow-hidden rounded-lg border border-slate-700 bg-slate-900">
             <div className="bg-slate-800 p-2 text-xs font-mono text-slate-300 uppercase flex items-center gap-2 border-b border-slate-700">
                <TableIcon className="w-4 h-4 text-indigo-400" />
                {tableData.title}
             </div>
             <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm font-mono">
                     <thead className="bg-slate-800 text-slate-400">
                         <tr>
                             {tableData.columns.map((col, idx) => (
                                 <th key={idx} className="px-4 py-2 font-medium border-b border-slate-700 whitespace-nowrap">
                                     {col}
                                 </th>
                             ))}
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-700/50">
                         {tableData.rows.map((row, rIdx) => (
                             <tr key={rIdx} className="hover:bg-slate-800/50 transition-colors">
                                 {row.data.map((cell, cIdx) => (
                                     <td key={cIdx} className="px-4 py-2 text-slate-300 whitespace-nowrap">
                                         {cell}
                                     </td>
                                 ))}
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
        </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700 shadow-2xl">
      {/* Header / Status Bar */}
      <div className="p-4 border-b border-slate-700 bg-slate-800/80 backdrop-blur flex justify-between items-center">
        <div className="flex items-center gap-2">
            <TerminalIcon className="w-5 h-5 text-indigo-400" />
            <h2 className="font-mono font-bold text-indigo-400">VERNACULAR OPS <span className="text-xs font-normal opacity-70">BI SUITE</span></h2>
        </div>
        <div className={`font-mono font-bold text-sm flex items-center gap-2 ${getStatusColor(businessState.insightType)}`}>
            {businessState.insightType === InsightType.ALERT && <AlertCircle className="w-4 h-4" />}
            MODE: {businessState.status}
        </div>
      </div>

      {/* BI Dashboard Metrics */}
      <div className="grid grid-cols-3 gap-2 p-4 border-b border-slate-800 bg-slate-900/50">
        <div className="flex flex-col items-center justify-center p-2 bg-slate-800 rounded border border-slate-700">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Database className="w-4 h-4" /> <span className="text-xs">RECORDS</span>
            </div>
            <span className="font-mono text-xl font-bold text-white">{businessState.recordsLoaded > 0 ? businessState.recordsLoaded + '+' : 0}</span>
        </div>
        <div className="flex flex-col items-center justify-center p-2 bg-slate-800 rounded border border-slate-700">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
                <BarChart3 className="w-4 h-4" /> <span className="text-xs">CONFIDENCE</span>
            </div>
            <span className="font-mono text-xl font-bold text-white">{businessState.confidenceScore}%</span>
        </div>
        <div className="flex flex-col items-center justify-center p-2 bg-slate-800 rounded border border-slate-700">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
                <FileSpreadsheet className="w-4 h-4" /> <span className="text-xs">TYPE</span>
            </div>
            <span className="font-mono text-xs font-bold text-white mt-1">{businessState.insightType}</span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} w-full`}
          >
            <div 
              className={`max-w-[95%] p-3 rounded-lg ${
                msg.sender === 'user' 
                  ? 'bg-indigo-600 text-white rounded-br-none' 
                  : 'bg-slate-800 text-indigo-100 border border-slate-700 rounded-bl-none w-full'
              }`}
            >
              <div className="flex items-center gap-2 mb-1 opacity-50 text-xs">
                 <span>{msg.sender === 'user' ? 'YOU' : 'ANALYST'}</span>
                 <span>{msg.timestamp.toLocaleTimeString()}</span>
              </div>
              <p className="whitespace-pre-wrap">{msg.text}</p>
              
              {/* RENDER CHART IF AVAILABLE */}
              {msg.chartData && renderChart(msg.chartData)}

              {/* RENDER TABLE IF AVAILABLE */}
              {msg.tableData && renderTable(msg.tableData)}
              
            </div>
          </div>
        ))}
        {isProcessing && (
           <div className="flex items-start">
             <div className="bg-slate-800 text-indigo-300 border border-slate-700 p-3 rounded-lg rounded-bl-none animate-pulse">
                <p>ANALYZING DATA...</p>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-800 border-t border-slate-700">
        <form onSubmit={handleSubmit} className="flex gap-2 relative">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".csv,.txt"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`p-3 rounded border transition-colors ${activeFiles.length > 0 ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600'}`}
              title="Add CSV Data"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            
            <div className="flex-1 relative">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isListening ? "Listening..." : (activeFiles.length > 0 ? `Ask about ${activeFiles.length} files...` : "Ask a business question (English/Hindi)...")}
                    className={`w-full h-full bg-slate-900 text-white font-mono pl-4 pr-10 rounded border ${isListening ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'} outline-none transition-all`}
                    disabled={isProcessing}
                />
                <button
                    type="button"
                    onClick={toggleListening}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors ${isListening ? 'text-red-400 bg-red-400/10 animate-pulse' : 'text-slate-400 hover:text-indigo-400'}`}
                    title={isListening ? "Stop Listening" : "Speak (Voice Input)"}
                >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
            </div>
            
            <button 
                type="submit" 
                disabled={!input.trim() || isProcessing}
                className="p-3 bg-indigo-600 text-white rounded hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
            >
                <Send className="w-5 h-5" />
            </button>
        </form>
        <div className="mt-2 text-xs text-slate-500 font-mono flex items-center justify-between">
             <span>Supported: SQL, CSV Analysis, Voice, Multi-file</span>
             {activeFiles.length > 0 && (
               <div className="flex gap-2 items-center">
                 <span className="text-indigo-400 flex items-center gap-1">
                   <Database className="w-3 h-3" /> Context:
                 </span>
                 <div className="flex gap-1 flex-wrap justify-end max-w-[50%]">
                   {activeFiles.map(f => (
                     <div key={f} className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-700 rounded border border-slate-600">
                         <span className="text-emerald-400 whitespace-nowrap">{f}</span>
                         <button 
                            type="button"
                            onClick={() => onRemoveFile(f)}
                            className="text-slate-400 hover:text-red-400 transition-colors"
                            title="Remove file"
                         >
                            <X className="w-3 h-3" />
                         </button>
                     </div>
                   ))}
                 </div>
               </div>
             )}
        </div>
      </div>
    </div>
  );
};

export default Terminal;