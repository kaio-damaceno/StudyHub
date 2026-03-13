# 📁 Pasta de Assets - Logos e Ícones

Coloque suas logos aqui nesta pasta `assets/`.

## 📋 Arquivos necessários:

### 1. **logo.ico** ou **icon.ico** (ou .png para Mac/Linux)
- **Uso**: Ícone da janela do Electron e do executável
- **Tamanho recomendado**: 
  - Windows: `.ico` com múltiplos tamanhos (16x16, 32x32, 48x48, 256x256) - **RECOMENDADO**
  - Mac/Linux: `.png` 512x512px ou 1024x1024px
- **Localização**: `assets/logo.ico`, `assets/icon.ico`, `assets/logo.png` ou `assets/icon.png`
- **Onde aparece**: Barra de tarefas, janela do app, executável, dock (Mac)
- **Importante**: 
  - O arquivo deve estar nesta pasta para funcionar em desenvolvimento e produção
  - Para Windows, use `.ico` para melhor compatibilidade
  - O electron-builder procurará por `logo.ico` primeiro, depois `icon.ico`

### 2. **favicon.png** (ou favicon.ico)
- **Uso**: Favicon do navegador (aba do navegador)
- **Tamanho recomendado**: 32x32px ou 64x64px
- **Localização**: `assets/favicon.png` ou `assets/favicon.ico`
- **Onde aparece**: Aba do navegador

### 3. **logo.svg** (ou logo.png)
- **Uso**: Logo visual na tela inicial (NewTab), Sidebar e TabBar
- **Tamanho recomendado**: SVG (preferível) ou PNG 200-300px de largura com fundo transparente
- **Localização**: `assets/logo.svg` ou `assets/logo.png`
- **Onde aparece**: 
  - Tela inicial do app (NewTab)
  - Botão logo/home na Sidebar
  - Ícone nas abas quando é "Nova Aba"
- **Importante**: O arquivo será servido como `/logo.svg` (sem o prefixo `/assets/`)

## 🎨 Dicas:

- Use PNG com fundo transparente para melhor integração
- Para Windows, você pode usar `.ico` para o ícone do app
- Mantenha os arquivos leves para melhor performance
- Se não quiser usar a logo visual, apenas não coloque o `logo.png` - o texto "Study Hub" continuará aparecendo

## ✅ Após adicionar os arquivos:

1. Reinicie o servidor de desenvolvimento (`npm run dev`)
2. Para produção, faça o build: `npm run build`
3. O Electron Builder usará automaticamente o `logo.ico` (ou `icon.ico`) para criar o executável
4. **Importante**: Após empacotar, o ícone na barra de tarefas do Windows deve mostrar sua logo customizada

## 🔧 Troubleshooting:

Se o ícone não aparecer corretamente no executável:
- Certifique-se de que o arquivo `.ico` contém múltiplos tamanhos (16x16, 32x32, 48x48, 256x256)
- Tente renomear `logo.ico` para `icon.ico` se ainda não funcionar
- Limpe a pasta `dist` e faça o build novamente: `npm run build && npm run dist:win`
