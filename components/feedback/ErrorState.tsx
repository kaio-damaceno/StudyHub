
import React, { useState } from 'react';
import { Icon } from '../ui/Icon';

interface ErrorStateProps {
  title: string;
  message: string;
  code?: string | number;
  onRetry?: () => void;
  onHome?: () => void;
  imageSrc?: string; // Suporte para suas imagens personalizadas
  icon?: string;     // Ícone fallback do Lucide
}

const ErrorState: React.FC<ErrorStateProps> = ({ 
  title, 
  message, 
  code, 
  onRetry, 
  onHome, 
  imageSrc, 
  icon = 'alert' 
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-8 text-center bg-[#0a0e27] animate-[fadeIn_0.3s_ease] absolute inset-0">
      
      {/* Ilustração ou Ícone */}
      <div className="mb-6 relative group">
        {imageSrc && !imgError ? (
          <img 
            src={imageSrc} 
            alt="Error Illustration" 
            className="w-64 h-64 object-contain drop-shadow-[0_0_30px_rgba(59,130,246,0.2)] animate-[float_6s_ease-in-out_infinite]"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-24 h-24 rounded-3xl bg-[#1e233c] border border-white/5 flex items-center justify-center shadow-2xl relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
             <div className="absolute inset-0 bg-blue-500/10 rounded-3xl blur-xl"></div>
             <Icon name={icon} size={48} className="text-blue-400 relative z-10" />
          </div>
        )}
      </div>

      {/* Conteúdo de Texto */}
      <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">{title}</h2>
      <p className="text-base text-gray-400 max-w-lg mb-2 leading-relaxed">
        {message}
      </p>
      {code && (
        <span className="text-xs font-mono text-gray-500 bg-white/5 px-3 py-1.5 rounded mb-10">
          Error Code: {code}
        </span>
      )}

      {/* Ações */}
      <div className="flex gap-4">
        {onHome && (
          <button 
            onClick={onHome}
            className="px-8 py-3 rounded-xl border border-white/10 text-gray-300 font-bold text-sm hover:bg-white/5 hover:text-white transition-all flex items-center gap-2"
          >
            <Icon name="home" size={16} /> Início
          </button>
        )}
        
        {onRetry && (
          <button 
            onClick={onRetry}
            className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 transition-all flex items-center gap-2 active:scale-95"
          >
            <Icon name="rotateCw" size={16} /> Tentar Novamente
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorState;
