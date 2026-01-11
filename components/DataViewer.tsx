import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { FileText, Database, Table } from 'lucide-react';

interface DataViewerProps {
  files: Record<string, string>;
}

const DataViewer: React.FC<DataViewerProps> = ({ files }) => {
  const fileNames = Object.keys(files);
  const [activeFile, setActiveFile] = useState<string | null>(null);

  useEffect(() => {
    if (fileNames.length > 0 && (!activeFile || !files[activeFile])) {
      setActiveFile(fileNames[0]);
    } else if (fileNames.length === 0) {
      setActiveFile(null);
    }
  }, [fileNames, activeFile, files]);

  const parsedData = useMemo(() => {
    if (!activeFile || !files[activeFile]) return null;
    
    const result = Papa.parse(files[activeFile], {
      header: true,
      skipEmptyLines: true,
      preview: 100 // Limit to 100 rows for performance
    });
    
    return {
      columns: result.meta.fields || [],
      data: result.data as Record<string, string>[]
    };
  }, [activeFile, files]);

  if (fileNames.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 border border-slate-800 rounded-lg bg-slate-900/50">
        <Database className="w-12 h-12 mb-4 opacity-50" />
        <p className="font-mono text-sm">NO DATA SOURCES LOADED</p>
        <p className="text-xs opacity-50 mt-2">Upload a CSV file via terminal to inspect data</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-slate-900/50 backdrop-blur border border-slate-700 rounded-lg overflow-hidden shadow-inner">
      {/* Tabs */}
      <div className="flex items-center bg-slate-900/80 border-b border-slate-700 overflow-x-auto scrollbar-hide">
        <div className="px-3 py-2 text-slate-500 border-r border-slate-800">
             <Table className="w-4 h-4" />
        </div>
        {fileNames.map(name => (
          <button
            key={name}
            onClick={() => setActiveFile(name)}
            className={`px-4 py-2 text-xs font-mono flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeFile === name 
                ? 'bg-slate-800 text-indigo-400 border-r border-slate-700' 
                : 'text-slate-500 hover:text-slate-300 border-r border-slate-800'
            }`}
          >
            <FileText className="w-3 h-3" />
            {name}
          </button>
        ))}
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto relative">
        {parsedData && parsedData.columns.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-800/90 sticky top-0 z-10 text-[10px] font-mono text-slate-400 uppercase tracking-wider backdrop-blur">
              <tr>
                {parsedData.columns.map((col) => (
                  <th key={col} className="px-4 py-3 border-b border-slate-700 font-medium whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-xs font-mono text-slate-300 divide-y divide-slate-800/50">
              {parsedData.data.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                  {parsedData.columns.map((col) => (
                    <td key={`${idx}-${col}`} className="px-4 py-2 border-r border-slate-800/30 last:border-r-0 whitespace-nowrap truncate max-w-[200px]">
                      {row[col]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 font-mono text-xs">
            <p>Unable to parse data or file is empty</p>
          </div>
        )}
      </div>
      
      {/* Status Bar */}
      <div className="bg-slate-900 border-t border-slate-700 p-2 text-[10px] font-mono text-slate-500 flex justify-between items-center shrink-0">
         <span>PREVIEW MODE (TOP 100 ROWS)</span>
         <span className="text-indigo-400">{activeFile}</span>
      </div>
    </div>
  );
};

export default DataViewer;