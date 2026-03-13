
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const removeCrossorigin = () => {
  return {
    name: 'remove-crossorigin',
    transformIndexHtml(html: string) {
      return html.replace(/ crossorigin/g, '');
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), removeCrossorigin()],
  server: {
    port: 5173,
  },
  base: './', // Importante para o Electron carregar assets corretamente
  build: {
    outDir: 'dist-vite', // Pasta separada para o build do Vite
    emptyOutDir: true,
  },
  publicDir: 'assets', // Pasta pública para assets estáticos (logos, ícones, etc)
});
