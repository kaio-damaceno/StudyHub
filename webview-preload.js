
const { ipcRenderer } = require('electron');

const getExtensionId = (url) => {
  const match = url.match(/\/detail\/([^\/]+\/)?([a-z]{32})/);
  return match ? match[2] : null;
};

const injectInstallButton = () => {
  if (document.getElementById('study-hub-install-btn')) return true;
  const extensionId = getExtensionId(window.location.href);
  if (!extensionId) return false;

  const btn = document.createElement('button');
  btn.id = 'study-hub-install-btn';
  const iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>`;
  btn.innerHTML = `<div style="display: flex; align-items: center; gap: 10px;">${iconSvg}<span style="font-weight: 600; letter-spacing: 0.3px;">Adicionar ao Study Hub</span></div>`;
  Object.assign(btn.style, {
    position: 'fixed', bottom: '32px', right: '32px', zIndex: '2147483647',
    padding: '14px 24px', backgroundColor: '#3b82f6', color: 'white',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px',
    boxShadow: '0 10px 30px -5px rgba(37, 99, 235, 0.5)',
    fontFamily: 'system-ui, sans-serif', fontSize: '14px', cursor: 'pointer',
    transition: 'transform 0.2s', display: 'flex', alignItems: 'center'
  });
  btn.onmouseover = () => { btn.style.transform = 'scale(1.05)'; };
  btn.onmouseout = () => { btn.style.transform = 'scale(1)'; };
  btn.onclick = () => {
    btn.innerHTML = 'Baixando...';
    btn.style.backgroundColor = '#10b981';
    let title = document.title.replace(' - Chrome Web Store', '').trim();
    ipcRenderer.send('install-cws-extension', { id: extensionId, title });
  };
  document.body.appendChild(btn);
  return true;
};

const observer = new MutationObserver((mutations, obs) => {
  const isStore = window.location.href.includes('chromewebstore.google.com');
  if (isStore) {
      const injected = injectInstallButton();
      if (injected) obs.disconnect();
  }
});

window.addEventListener('DOMContentLoaded', () => {
  if (window.location.href.includes('chromewebstore.google.com')) {
      const injected = injectInstallButton();
      if (!injected) observer.observe(document.body, { childList: true, subtree: true });
  }

  let scrollTimer = null;
  window.addEventListener('scroll', () => {
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
          ipcRenderer.sendToHost('scroll-position', window.scrollY);
      }, 800);
  }, { passive: true });

  // ALT + CLICK -> Download
  document.addEventListener('click', (e) => {
      if (e.altKey && (e.target.tagName === 'A' || e.target.parentElement.tagName === 'A')) {
          e.preventDefault();
          e.stopPropagation();
          const href = e.target.tagName === 'A' ? e.target.href : e.target.parentElement.href;
          if (href) ipcRenderer.sendToHost('download-request', href);
      }
  }, true);
});
