<div align="center">

<img src="assets/logo.png" alt="Study Hub Logo" width="120" />

# 📚 Study Hub

### O navegador focado em estudos e produtividade

[![Electron](https://img.shields.io/badge/Electron-39.x-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](license)

**Study Hub** é um ecossistema de produtividade completo para estudantes, que integra navegação web, anotações inteligentes e ferramentas de estudo em uma única interface desktop unificada.

[🚀 Download](#-instalação) · [✨ Features](#-features) · [🛠️ Setup Dev](#%EF%B8%8F-desenvolvimento) · [📖 Docs](#-documentação)

---

</div>

## ✨ Features

<table>
<tr>
<td width="50%">

### 🌐 Navegador Integrado
- Navegação com abas completa
- Gerenciador de extensões do Chrome
- Barra de busca inteligente (Google, Bing, DuckDuckGo)
- User Agent customizado para compatibilidade total

</td>
<td width="50%">

### 🧠 Flashcards
- Criação e organização de coleções
- Sistema de repetição espaçada
- Importação e exportação (JSON / TXT)
- Estatísticas de aprendizado

</td>
</tr>
<tr>
<td width="50%">

### 📝 Notas e Documentos
- Editor de texto rico com formatação completa
- Suporte a imagens, vídeos, tabelas e listas
- Leitor de PDF e DOCX integrado
- Visualizador de Markdown

</td>
<td width="50%">

### 🗺️ Mapas Mentais
- Canvas infinito com zoom e pan
- Criação de nós e conexões visuais
- Organização hierárquica de ideias
- Exportação para PDF

</td>
</tr>
<tr>
<td width="50%">

### 🎯 Vision Board
- Quadro de visão personalizado
- Arrastar e soltar blocos de conteúdo
- Templates para metas e objetivos

</td>
<td width="50%">

### 🔄 Auto-Update
- Atualização automática via GitHub Releases
- Notificações de novas versões
- Download e instalação em background
- Verificação periódica a cada 30 minutos

</td>
</tr>
</table>

## 🏗️ Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| **Runtime** | Electron 39 |
| **Frontend** | React 18 + TypeScript 5 |
| **Build** | Vite 7 |
| **UI Components** | Radix UI + Lucide Icons |
| **Styling** | Tailwind CSS 3 |
| **State** | Zustand |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **Canvas** | Fabric.js |
| **PDF** | PDF.js + react-pdf |
| **Updater** | electron-updater |
| **Packaging** | electron-builder |

## 🚀 Instalação

### Download

Baixe a última versão na [página de Releases](https://github.com/kaio-damaceno/StudyHub/releases).

### Windows
1. Baixe o arquivo `.exe` da release mais recente
2. Execute o instalador
3. O Study Hub será instalado e abrirá automaticamente

## 🛠️ Desenvolvimento

### Pré-requisitos

- [Node.js](https://nodejs.org/) 18+
- [Git](https://git-scm.com/)

### Setup

```bash
# Clone o repositório
git clone https://github.com/kaio-damaceno/StudyHub.git
cd StudyHub

# Instale as dependências
npm install

# Inicie em modo de desenvolvimento
npm run start
```

### Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run start` | Inicia Vite + Electron em modo dev |
| `npm run dev` | Inicia apenas o servidor Vite |
| `npm run build` | Compila TypeScript + Vite build |
| `npm run dist:win` | Gera o instalador Windows (.exe) |
| `npm run electron` | Inicia apenas o Electron |

### Estrutura do Projeto

```
StudyHub/
├── main.js              # Processo principal do Electron
├── preload.js           # Script de preload (bridge IPC)
├── index.tsx            # Entry point do React
├── App.tsx              # Componente raiz da aplicação
├── types.ts             # Definições de tipos TypeScript
├── vite.config.ts       # Configuração do Vite
├── components/
│   ├── shell/           # Barra de título, abas, controles
│   ├── views/           # Páginas e views principais
│   ├── notes/           # Editor de notas
│   ├── Flashcards/      # Sistema de flashcards
│   ├── MindMap/         # Mapas mentais
│   ├── VisionBoard/     # Quadro de visão
│   ├── documents/       # Leitor de documentos
│   ├── overlay/         # Overlays e modais
│   ├── tools/           # Ferramentas auxiliares
│   └── ui/              # Componentes base reutilizáveis
├── contexts/            # React Contexts
├── core/                # Lógica core da aplicação
├── hooks/               # Custom React Hooks
├── services/            # Serviços externos
└── assets/              # Ícones, imagens, logos
```

## 📦 Build e Distribuição

### Gerando o Instalador

```bash
# Build completo + instalador Windows
npm run dist:win
```

### Publicando com Auto-Update

Para que o auto-update funcione, publique releases no GitHub:

```bash
# Configure o token do GitHub
set GH_TOKEN=seu_github_token

# Build e publish automático
npm run dist:win -- --publish always
```

> **Importante:** Incremente a versão no `package.json` antes de cada release.

## 📖 Documentação

- **Extensões:** Suporte a extensões do Chrome via Chrome Web Store
- **Armazenamento:** Dados salvos localmente em `%APPDATA%/study-hub-browser/storage/`
- **Logs:** Logs do auto-updater disponíveis via `electron-log`

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](license) para mais detalhes.

---

<div align="center">

Feito com 💜 por [Kaio Damaceno](https://github.com/kaio-damaceno)

</div>
