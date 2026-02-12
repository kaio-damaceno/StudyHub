
import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '../ui/Icon';

interface AudioRecorderProps {
  onAudioReady: (base64: string) => void;
  label?: string;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onAudioReady, label }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Convert to base64 for storage
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          onAudioReady(base64String);
        };
        reader.readAsDataURL(blob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Erro ao acessar microfone:", err);
      alert("Não foi possível acessar o microfone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      const reader = new FileReader();
      reader.onloadend = () => {
        onAudioReady(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-[#0a0e27] border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
      {label && <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</span>}
      
      <div className="flex items-center gap-3">
        {!isRecording ? (
          <button 
            type="button"
            onClick={startRecording}
            className="w-12 h-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500/30 transition-all"
          >
            <Icon name="play" size={20} className="fill-current" />
          </button>
        ) : (
          <button 
            type="button"
            onClick={stopRecording}
            className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center animate-pulse"
          >
            <Icon name="stop" size={20} className="fill-current" />
          </button>
        )}

        <div className="flex-1">
          {isRecording ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
              <span className="text-xs text-red-400 font-mono font-bold uppercase tracking-widest">Gravando...</span>
            </div>
          ) : audioUrl ? (
            <audio src={audioUrl} controls className="h-8 w-full max-w-[200px]" />
          ) : (
            <span className="text-xs text-gray-500 italic">Pronto para gravar ou upload</span>
          )}
        </div>

        {!isRecording && (
          <div className="relative">
            <input type="file" accept="audio/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400">
               <Icon name="download" size={18} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioRecorder;
