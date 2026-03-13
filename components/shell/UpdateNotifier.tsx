import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { Button } from './Button'
import { toast, Toaster } from 'sonner'
import { Download, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'
// Button and Progress replaced with inline styled components

// Types
interface UpdateInfo {
  version: string
  notes: string
}

interface UpdateState {
  available: boolean
  downloading: boolean
  progress: number
  downloaded: boolean
  version?: string
  error?: string
}

// Context
interface UpdateContextType {
  checkForUpdates: () => Promise<void>
  installUpdate: () => void
}

const UpdateContext = createContext<UpdateContextType | null>(null)

export const useUpdate = () => {
  const context = useContext(UpdateContext)
  if (!context) throw new Error('useUpdate must be used within UpdateProvider')
  return context
}

// Provider
export const UpdateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [updateState, setUpdateState] = useState<UpdateState>({
    available: false,
    downloading: false,
    progress: 0,
    downloaded: false,
  })

  const showUpdateToast = useCallback((title: string, description?: string, actions?: React.ReactNode) => {
    toast.custom((t) => (
      <div className="bg-gradient-to-r from-indigo-600/95 to-purple-600/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-6 w-96 max-w-sm mx-2">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-white/90" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm leading-tight mb-1">{title}</h3>
            {description && <p className="text-white/80 text-xs leading-relaxed">{description}</p>}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toast.dismiss(t)}
            className="w-8 h-8 hover:bg-white/20 p-0 shrink-0"
          >
            <AlertCircle className="w-4 h-4" />
          </Button>
        </div>
        {actions}
      </div>
    ), {
      duration: 0,
      dismissible: true,
      style: {
        background: 'transparent',
        padding: 0,
        border: 'none',
        boxShadow: 'none',
      },
    })
  }, [])

  const checkForUpdates = useCallback(async () => {
    try {
      // Trigger IPC via window
      const result = await window.api?.checkForUpdates?.()
      if (result?.status === 'checking') {
        toast.success('Verificando atualizações...', {
          description: 'Buscando nova versão...',
          duration: 3000,
        })
      }
    } catch (error) {
      toast.error('Erro ao verificar updates', {
        description: 'Tente novamente mais tarde.',
      })
    }
  }, [])

  const installUpdate = useCallback(() => {
    toast.success('Reiniciando para instalar...', {
      description: 'A nova versão será instalada.',
      duration: 2000,
    })
    // Chama o main process para executar quitAndInstall
    setTimeout(() => {
      window.api?.installUpdate?.()
    }, 1500)
  }, [])

  // Listen to IPC events from main process
  useEffect(() => {
    const cleanups: (() => void)[] = []

    const unsubAvailable = window.api?.onUpdateAvailable?.((info: any) => {
      setUpdateState(prev => ({ ...prev, available: true, version: info?.version }))
      showUpdateToast(
        'Nova versão disponível!',
        'StudyHub v' + (info?.version || 'NOVO'),
        <div className="flex flex-col gap-2 pt-2">
          <div className="flex gap-1">
            <Button size="sm" className="flex-1 bg-white/10 hover:bg-white/20 text-white h-9 font-medium" onClick={checkForUpdates}>
              <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
              Verificar Novamente
            </Button>
          </div>
        </div>
      )
    })
    if (unsubAvailable) cleanups.push(unsubAvailable)

    const unsubProgress = window.api?.onUpdateProgress?.((progress: any) => {
      setUpdateState(prev => ({ ...prev, downloading: true, progress: progress.percent }))
    })
    if (unsubProgress) cleanups.push(unsubProgress)

    const unsubDownloaded = window.api?.onUpdateDownloaded?.((info: any) => {
      setUpdateState(prev => ({ ...prev, downloaded: true, version: info?.version }))
      showUpdateToast(
        'Atualização baixada!',
        'Clique para reiniciar e instalar.',
        <div className="flex flex-col gap-2 pt-2">
          <Button
            size="sm"
            className="bg-emerald-500/90 hover:bg-emerald-400/90 text-white font-medium h-10 flex items-center gap-2 shadow-lg"
            onClick={installUpdate}
          >
            <CheckCircle className="w-4 h-4" />
            Reiniciar e Instalar
          </Button>
        </div>
      )
    })
    if (unsubDownloaded) cleanups.push(unsubDownloaded)

    const unsubError = window.api?.onUpdateError?.((message: string) => {
      setUpdateState(prev => ({ ...prev, error: message }))
      console.error('Auto-update error:', message)
    })
    if (unsubError) cleanups.push(unsubError)

    return () => {
      cleanups.forEach(unsub => unsub())
    }
  }, [checkForUpdates, installUpdate, showUpdateToast])

  return (
    <UpdateContext.Provider value={{ checkForUpdates, installUpdate }}>
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        expand={false}
        gap={4}
        className="mt-4"
        toastOptions={{
          className: 'border-white/10 shadow-2xl backdrop-blur-xl',
          style: { background: 'hsl(var(--background))' },
        }}
      />
    </UpdateContext.Provider>
  )
}

