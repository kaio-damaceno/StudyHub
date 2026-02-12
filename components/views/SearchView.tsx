
import React, { useState, useEffect } from 'react';
import { Icon } from '../ui/Icon';
import { searchWeb } from '../../services/searchService';
import { SearchCategory, SearchResultItem } from '../../types';

interface SearchViewProps {
  query: string;
  onNavigate: (url: string) => void;
  searchEngine: 'google' | 'duckduckgo' | 'bing' | 'yahoo';
}

const SearchView: React.FC<SearchViewProps> = ({ query, onNavigate, searchEngine }) => {
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('ALL');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [localQuery, setLocalQuery] = useState(query);

  useEffect(() => {
    setActiveCategory('ALL');
  }, [query]);

  useEffect(() => {
    if (!query) return;
    setLocalQuery(query);

    const performSearch = async () => {
        setLoading(true);
        setResults([]);
        try {
            const data = await searchWeb(query, activeCategory, searchEngine);
            setResults(data.items);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    performSearch();
  }, [query, activeCategory, searchEngine]);

  const handleSubmitNewSearch = (e: React.FormEvent) => {
      e.preventDefault();
      if (localQuery.trim() !== query) {
          onNavigate(localQuery); 
      }
  };

  const categories: { id: SearchCategory, label: string, icon: string }[] = [
      { id: 'ALL', label: 'Web', icon: 'search' },
      { id: 'IMAGES', label: 'Imagens', icon: 'image' },
      { id: 'VIDEOS', label: 'Vídeos', icon: 'youtube' },
      { id: 'NEWS', label: 'Notícias', icon: 'fileText' },
  ];

  const getFavicon = (url: string) => {
    try {
        const domain = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch { return null; }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#0a0e27] overflow-hidden animate-[fadeIn_0.2s_ease]">
      
      {/* Header Fixo */}
      <div className="px-4 md:px-8 pt-4 md:pt-6 pb-2 md:pb-4 border-b border-white/5 bg-[#0f1223]/80 backdrop-blur-xl sticky top-0 z-30 shadow-lg">
          
          <form onSubmit={handleSubmitNewSearch} className="max-w-4xl mx-auto mb-4 md:mb-6 relative group">
              <div className="absolute inset-0 bg-blue-500/10 rounded-2xl blur-lg group-focus-within:bg-blue-500/20 transition-all duration-500 hidden md:block" />
              <div className="relative flex items-center bg-[#14182d] border border-white/10 rounded-xl md:rounded-2xl p-2 shadow-inner transition-colors">
                  <div className="pl-2 md:pl-4 pr-2 text-gray-500">
                      <Icon name="search" size={18} />
                  </div>
                  <input 
                      type="text" 
                      value={localQuery}
                      onChange={(e) => setLocalQuery(e.target.value)}
                      className="flex-1 bg-transparent border-none outline-none text-white text-sm md:text-base h-8 md:h-10 placeholder-gray-600"
                      placeholder={`Pesquise no ${searchEngine}...`}
                  />
                  <button type="submit" className="p-1.5 md:p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg md:rounded-xl transition-all">
                      <Icon name="arrowRight" size={16} />
                  </button>
              </div>
          </form>

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 max-w-5xl mx-auto">
              {categories.map(cat => (
                  <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`
                          flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-bold transition-all border whitespace-nowrap
                          ${activeCategory === cat.id 
                             ? 'bg-blue-600 text-white border-blue-500' 
                             : 'bg-[#1e233c] text-gray-400 border-white/5 hover:bg-[#252b48]'
                          }
                      `}
                  >
                      <Icon name={cat.icon} size={12} />
                      {cat.label}
                  </button>
              ))}
          </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 w-full">
          <div className="max-w-5xl mx-auto space-y-4 md:space-y-8 pb-20 md:pb-0">
              
              {loading ? (
                  <div className="space-y-4 animate-pulse">
                      <div className="h-20 bg-[#1e233c] rounded-xl w-full border border-white/5"></div>
                      <div className="h-20 bg-[#1e233c] rounded-xl w-full border border-white/5"></div>
                      <div className="h-20 bg-[#1e233c] rounded-xl w-full border border-white/5"></div>
                  </div>
              ) : (
                  <div className={`grid gap-4 md:gap-6 ${activeCategory === 'IMAGES' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1'}`}>
                      {results.map((item, idx) => (
                          <div key={idx} className="group">
                              
                              {(activeCategory as string) === 'IMAGES' && item.thumbnail ? (
                                  // CARD DE IMAGEM
                                  <div 
                                    onClick={() => onNavigate(item.link)}
                                    className="aspect-square bg-[#1e233c] rounded-xl overflow-hidden border border-white/5 relative shadow-lg cursor-pointer"
                                  >
                                      <img src={item.thumbnail} className="w-full h-full object-cover" alt={item.title} />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                          <span className="text-[10px] text-white font-medium truncate w-full">{item.title}</span>
                                      </div>
                                  </div>
                              ) : (
                                  // RESULTADO WEB
                                  <div className="flex gap-3 md:gap-5 p-3 md:p-5 rounded-xl bg-[#1e233c]/20 border border-transparent hover:bg-[#1e233c]/60 hover:border-white/5 transition-all">
                                      <div 
                                        className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-[#14182d] shrink-0 overflow-hidden cursor-pointer border border-white/10 flex items-center justify-center"
                                        onClick={() => onNavigate(item.link)}
                                      >
                                          {item.thumbnail ? (
                                             <img src={item.thumbnail} className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
                                          ) : (
                                             <img src={getFavicon(item.link) || ''} className="w-5 h-5 opacity-70" onError={(e) => e.currentTarget.style.display = 'none'} />
                                          )}
                                      </div>

                                      <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-0.5">
                                              <div className="text-[10px] font-mono text-blue-400 truncate bg-blue-500/10 px-1.5 py-0.5 rounded">{item.displayLink}</div>
                                          </div>
                                          <h3 
                                            onClick={() => onNavigate(item.link)}
                                            className="text-white hover:text-blue-400 font-bold text-sm md:text-lg cursor-pointer leading-tight mb-1"
                                          >
                                              {item.title}
                                          </h3>
                                          <p className="text-xs md:text-sm text-gray-400 leading-relaxed line-clamp-2 md:line-clamp-2">
                                              {item.snippet}
                                          </p>
                                      </div>
                                  </div>
                              )}
                          </div>
                      ))}
                      
                      {results.length === 0 && !loading && (
                          <div className="text-center py-10 text-gray-500 text-sm">
                               Nenhum resultado encontrado.
                          </div>
                      )}
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default SearchView;
