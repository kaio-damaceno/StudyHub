import React from 'react';
import { Icon } from '../ui/Icon';
import { DownloadItem } from '../../types';

interface DownloadsPanelProps {
  downloads: DownloadItem[];
  onClose: () => void;
}

const DownloadsPanel: React.FC<DownloadsPanelProps> = ({ downloads, onClose }) => {
  // Ordena por tempo (mais recente primeiro)
  const sortedDownloads = [...downloads].sort((a, b) => b.startTime - a.startTime);

  const formatBytes = (bytes: number, decimals = 1) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleOpenFolder = (path: string) => {
    if (window.api && path) {
        window.api.openPath(path);
    }
  };

  return (
    <div className="absolute top-[45px] right-10 w-[320px] max-h-[400px] bg-[#14182d]/95 backdrop-blur-xl border border-blue-400/20 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden z-[100] animate-[fadeIn_0.2s_ease]">
      <div className="px-4 py-3 border-b border-blue-400/10 flex justify-between items-center bg-[#0f1223]/50">
        <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
           <Icon name="download" size={14} /> Downloads
        </span>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
            <Icon name="x" size={14} />
        </button>
      </div>

      <div className="overflow-y-auto p-2 space-y-2 custom-scrollbar">
        {sortedDownloads.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-sm">
                Nenhum download recente.
            </div>
        ) : (
            sortedDownloads.map((item) => {
                const percent = item.totalBytes > 0 ? (item.receivedBytes / item.totalBytes) * 100 : 0;
                const isCompleted = item.state === 'completed';
                const isCancelled = item.state === 'cancelled' || item.state === 'interrupted';
                
                return (
                    <div key={item.id} className="bg-[#1e233c]/40 border border-blue-400/10 rounded-lg p-3 hover:bg-[#1e233c]/60 transition-colors group">
                        <div className="flex items-start justify-between mb-1">
                            <div className="truncate text-sm font-medium text-gray-200 pr-2" title={item.filename}>
                                {item.filename}
                            </div>
                            {isCompleted && (
                                <button 
                                    onClick={() => handleOpenFolder(item.path)}
                                    className="text-blue-400 hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Mostrar na pasta"
                                >
                                    <Icon name="folderOpen" size={14} />
                                </button>
                            )}
                        </div>
                        
                        {!isCompleted && !isCancelled && (
                             <div className="w-full h-1 bg-[#0f1223] rounded-full mb-2 overflow-hidden">
                                <div 
                                    className="h-full bg-blue-400 transition-all duration-300"
                                    style={{ width: `${percent}%` }}
                                />
                             </div>
                        )}

                        <div className="flex justify-between items-center text-[10px] text-gray-500">
                            {isCancelled ? (
                                <span className="text-red-400">Cancelado</span>
                            ) : isCompleted ? (
                                <span className="text-green-400">Concluído • {formatBytes(item.totalBytes)}</span>
                            ) : (
                                <span>{formatBytes(item.receivedBytes)} / {formatBytes(item.totalBytes)}</span>
                            )}
                            
                            {isCompleted && (
                                <span className="text-gray-600 cursor-pointer hover:text-blue-400 hover:underline" onClick={() => handleOpenFolder(item.path)}>
                                    Abrir
                                </span>
                            )}
                        </div>
                    </div>
                );
            })
        )}
      </div>
    </div>
  );
};

export default DownloadsPanel;