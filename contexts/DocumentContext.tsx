
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DocumentFile } from '../types';

interface DocumentContextType {
  documents: DocumentFile[];
  activeDoc: DocumentFile | null;
  loadDocument: (file?: File) => void;
  openDocument: (id: string) => void;
  closeDocument: () => void;
  removeDocument: (id: string) => void;
  updateDocumentProgress: (id: string, page: number, zoom?: number) => void;
  importFromFileSystem: () => void;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export const useDocument = () => {
  const context = useContext(DocumentContext);
  if (!context) throw new Error('useDocument must be used within DocumentProvider');
  return context;
};

export const DocumentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [activeDoc, setActiveDoc] = useState<DocumentFile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function load() {
        if (window.api) {
            const saved = await window.api.storage.get<DocumentFile[]>('documents-library');
            if (saved) setDocuments(saved);
        } else {
            // LocalStorage fallback for dev mode without Electron
            const local = localStorage.getItem('study-hub-documents');
            if (local) setDocuments(JSON.parse(local));
        }
        setIsLoaded(true);
    }
    load();
  }, []);

  useEffect(() => {
      if (isLoaded && window.api) {
          const handler = setTimeout(() => {
              window.api.storage.set('documents-library', documents);
          }, 1000);
          return () => clearTimeout(handler);
      } else if (isLoaded) {
          localStorage.setItem('study-hub-documents', JSON.stringify(documents));
      }
  }, [documents, isLoaded]);

  const importFromFileSystem = useCallback(async () => {
      if (window.api) {
          const result = await window.api.selectDocument();
          if (result) {
              const newDoc: DocumentFile = {
                  id: `doc_${Date.now()}`,
                  path: result.path,
                  title: result.name,
                  lastOpened: Date.now(),
                  currentPage: 1,
                  zoom: 1.0,
                  tags: []
              };
              
              setDocuments(prev => {
                  const exists = prev.find(d => d.path === newDoc.path);
                  if (exists) {
                      setActiveDoc(exists);
                      return prev;
                  }
                  return [newDoc, ...prev];
              });
              setActiveDoc(newDoc);
          }
      }
  }, []);

  // Suporte a Drag & Drop (File Object do browser)
  const loadDocument = useCallback((file?: File) => {
      if (!file) return;
      // No Electron, o File object tem a propriedade .path
      const path = (file as any).path || URL.createObjectURL(file);
      
      const newDoc: DocumentFile = {
          id: `doc_${Date.now()}`,
          path: path,
          title: file.name,
          lastOpened: Date.now(),
          currentPage: 1,
          zoom: 1.0,
          tags: []
      };

      setDocuments(prev => {
          const exists = prev.find(d => d.path === newDoc.path);
          if (exists) {
              setActiveDoc(exists);
              return prev;
          }
          return [newDoc, ...prev];
      });
      setActiveDoc(newDoc);
  }, []);

  const openDocument = useCallback((id: string) => {
      const doc = documents.find(d => d.id === id);
      if (doc) {
          setActiveDoc(doc);
          setDocuments(prev => prev.map(d => d.id === id ? { ...d, lastOpened: Date.now() } : d));
      }
  }, [documents]);

  const closeDocument = useCallback(() => {
      setActiveDoc(null);
  }, []);

  const removeDocument = useCallback((id: string) => {
      if (activeDoc?.id === id) setActiveDoc(null);
      setDocuments(prev => prev.filter(d => d.id !== id));
  }, [activeDoc]);

  const updateDocumentProgress = useCallback((id: string, page: number, zoom?: number) => {
      setDocuments(prev => prev.map(d => {
          if (d.id === id) {
              const updated = { ...d, currentPage: page };
              if (zoom) updated.zoom = zoom;
              if (activeDoc?.id === id) setActiveDoc(updated);
              return updated;
          }
          return d;
      }));
  }, [activeDoc]);

  return (
    <DocumentContext.Provider value={{
      documents, activeDoc, loadDocument, openDocument, closeDocument, removeDocument, updateDocumentProgress, importFromFileSystem
    }}>
      {children}
    </DocumentContext.Provider>
  );
};
