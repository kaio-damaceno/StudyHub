
import React, { useState, useEffect } from 'react';
import { Icon } from '../ui/Icon';

const STUDY_TIPS = [
  "Use a técnica Pomodoro: 25 min de foco, 5 min de pausa.",
  "Beba água! Um cérebro hidratado processa informações 14% mais rápido.",
  "Explique o que aprendeu em voz alta (Técnica Feynman).",
  "Revise suas anotações antes de dormir para consolidar a memória.",
  "Evite multitarefas. O foco único aumenta a retenção.",
  "A música Lo-Fi ajuda a manter a concentração sem distrações.",
  "Organize seu ambiente. Mesa limpa, mente clara.",
];

interface LoadingScreenProps {
  message?: string;
  showTip?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = "Carregando...", showTip = true }) => {
  const [tip, setTip] = useState("");

  useEffect(() => {
    setTip(STUDY_TIPS[Math.floor(Math.random() * STUDY_TIPS.length)]);
  }, []);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0e27]/90 backdrop-blur-md animate-[fadeIn_0.2s_ease]">
      {/* GIF de Carregamento (Substituindo animação CSS para consistência) */}
      <div className="relative w-20 h-20 mb-6">
        <img 
            src="loading.gif" 
            alt="Loading" 
            className="w-full h-full object-contain" 
            onError={(e) => {
                // Fallback caso o gif não exista: Spinner CSS
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                    parent.innerHTML = `
                        <div class="absolute inset-0 border-2 border-blue-500/30 rounded-full animate-[spin_3s_linear_infinite]"></div>
                        <div class="absolute inset-2 border-2 border-t-blue-400 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-[spin_1.5s_linear_infinite]"></div>
                    `;
                }
            }}
        />
      </div>

      <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-2 animate-pulse">{message}</h3>
      
      {showTip && (
        <div className="mt-8 px-8 py-3 bg-white/5 border border-white/5 rounded-full flex items-center gap-3 max-w-md animate-[slideUp_0.5s_ease-out]">
            <Icon name="lightbulb" size={16} className="text-yellow-400 shrink-0" />
            <p className="text-xs text-gray-400 italic text-center leading-tight">
              "{tip}"
            </p>
        </div>
      )}
    </div>
  );
};

export default LoadingScreen;
