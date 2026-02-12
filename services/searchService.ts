
import { SearchCategory, SearchResponse, SearchResultItem } from "../types";

export const searchWeb = async (query: string, category: SearchCategory = 'ALL', engine: 'google' | 'duckduckgo' | 'bing' | 'yahoo' = 'google'): Promise<SearchResponse> => {
  const startTime = performance.now();
  
  try {
    let htmlText = '';

    if (window.api && window.api.search) {
        htmlText = await window.api.search(query, category, engine);
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    let results: SearchResultItem[] = [];

    // --- PARSERS ESPECÍFICOS POR MOTOR ---

    if (engine === 'google') {
        // Parsing Google
        const items = doc.querySelectorAll('.g, .uEierd'); 
        items.forEach(el => {
            const titleEl = el.querySelector('h3');
            const linkEl = el.querySelector('a');
            const snippetEl = el.querySelector('.VwiC3b, .IsZvec, .s3v9rd, .st'); 
            const imgEl = el.querySelector('img.XNo5Ab, .LicuJb');

            if (titleEl && linkEl) {
                let link = linkEl.getAttribute('href') || '';
                if (link.startsWith('/url?q=')) {
                    link = link.split('q=')[1].split('&')[0];
                    link = decodeURIComponent(link);
                }

                results.push({
                    title: titleEl.textContent || '',
                    link,
                    snippet: snippetEl?.textContent || '',
                    displayLink: new URL(link).hostname,
                    thumbnail: imgEl?.getAttribute('src') || undefined
                });
            }
        });

        if (category === 'IMAGES') {
            const imgItems = doc.querySelectorAll('.isv-r, .wXeWr');
            if (imgItems.length > 0) {
                 results = []; 
                 imgItems.forEach(el => {
                     const linkEl = el.querySelector('a:nth-child(2)');
                     const img = el.querySelector('img');
                     if (linkEl && img) {
                         results.push({
                             title: 'Imagem Google',
                             link: linkEl.getAttribute('href') || '',
                             snippet: '',
                             displayLink: 'google.com',
                             thumbnail: img.getAttribute('src') || ''
                         });
                     }
                 });
            }
        }
    } 
    
    else if (engine === 'bing') {
        // Parsing Bing
        const items = doc.querySelectorAll('li.b_algo');
        items.forEach(el => {
            const titleEl = el.querySelector('h2 a');
            const snippetEl = el.querySelector('.b_caption p, .b_algoSlug');
            
            if (titleEl) {
                results.push({
                    title: titleEl.textContent || '',
                    link: titleEl.getAttribute('href') || '',
                    snippet: snippetEl?.textContent || '',
                    displayLink: new URL(titleEl.getAttribute('href') || '').hostname
                });
            }
        });

        if (category === 'IMAGES') {
            const imgItems = doc.querySelectorAll('.iuscp');
            results = [];
            imgItems.forEach(el => {
                // Bing imagens é complexo, tenta pegar o atributo 'm' que é JSON
                const mAttr = el.getAttribute('m');
                let link = '';
                let thumb = '';
                let title = '';

                if (mAttr) {
                    try {
                        const m = JSON.parse(mAttr);
                        link = m.purl || m.murl;
                        thumb = m.turl;
                        title = m.t || 'Imagem Bing';
                    } catch {}
                }

                if (!link) {
                    const a = el.querySelector('a');
                    link = a?.getAttribute('href') || '';
                }
                
                if (!thumb) {
                    const img = el.querySelector('img.mimg');
                    thumb = img?.getAttribute('src') || '';
                }

                if (link && thumb) {
                     results.push({
                         title: title || 'Imagem Bing',
                         link: link,
                         snippet: '',
                         displayLink: 'bing.com',
                         thumbnail: thumb
                     });
                }
            });
        }
    }

    else if (engine === 'yahoo') {
        // Parsing Yahoo
        const items = doc.querySelectorAll('.algo, .Sr');
        items.forEach(el => {
            const titleEl = el.querySelector('h3.title a');
            const snippetEl = el.querySelector('.compText, .lh-16');
            
            if (titleEl) {
                let link = titleEl.getAttribute('href') || '';
                if (link.includes('/RU=')) {
                     try {
                        const parts = link.split('/RU=');
                        link = decodeURIComponent(parts[1].split('/')[0]);
                     } catch {}
                }

                results.push({
                    title: titleEl.textContent || '',
                    link,
                    snippet: snippetEl?.textContent || '',
                    displayLink: new URL(link).hostname
                });
            }
        });
        
        if (category === 'IMAGES') {
             // Yahoo Images (difícil parsear sem JS, mas tenta estrutura básica)
             const imgItems = doc.querySelectorAll('li.ld');
             results = [];
             imgItems.forEach(el => {
                 const a = el.querySelector('a');
                 const img = el.querySelector('img');
                 if (a && img) {
                     results.push({
                         title: 'Imagem Yahoo',
                         link: a.getAttribute('href') || '',
                         snippet: '',
                         displayLink: 'yahoo.com',
                         thumbnail: img.getAttribute('src') || ''
                     });
                 }
             });
        }
    }

    else {
        // Parsing DuckDuckGo (HTML Version)
        // A versão HTML do DDG é simples: .result
        const resultElements = doc.querySelectorAll('.result');
        resultElements.forEach((el) => {
            const titleEl = el.querySelector('.result__a');
            const snippetEl = el.querySelector('.result__snippet');
            const urlEl = el.querySelector('.result__url');
            const iconEl = el.querySelector('.result__icon__img');

            if (titleEl) {
                const rawLink = titleEl.getAttribute('href') || '';
                let link = rawLink;
                // DDG Redirect fix
                try {
                    const urlObj = new URL(rawLink, 'https://html.duckduckgo.com');
                    if (urlObj.pathname === '/l/') {
                        const uddg = urlObj.searchParams.get('uddg');
                        if (uddg) link = decodeURIComponent(uddg);
                    }
                } catch {}

                results.push({
                    title: titleEl.textContent?.trim() || 'Sem título',
                    link,
                    snippet: snippetEl?.textContent?.trim() || '',
                    displayLink: urlEl?.textContent?.trim() || link,
                    thumbnail: iconEl?.getAttribute('src') ? ('https:' + iconEl.getAttribute('src')) : undefined
                });
            }
        });
    }

    const endTime = performance.now();
    const searchTime = ((endTime - startTime) / 1000).toFixed(2);

    return {
      items: results,
      meta: {
        totalResults: results.length.toString(), 
        searchTime
      }
    };

  } catch (error) {
    console.error("Erro no Search Service:", error);
    return {
      items: [],
      meta: { totalResults: '0', searchTime: '0' }
    };
  }
};
