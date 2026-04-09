# 🛠️ Guia de Desenvolvimento

Este documento fornece instruções detalhadas para desenvolvedores configurarem e trabalharem no projeto localmente.

## 📋 Tabela de Conteúdo

- [Setup Inicial](#-setup-inicial)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Desenvolvimento](#-desenvolvimento)
- [Testing](#-testing)
- [Debugging](#-debugging)
- [Performance](#-performance)
- [Deployment](#-deployment)

---

## 🚀 Setup Inicial

### Pré-requisitos

```bash
node --version    # v18.0.0 ou superior
npm --version     # 9.0.0 ou superior
git --version     # 2.30.0 ou superior
```

### Passos de Setup

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/hub-study-browser.git
cd hub-study-browser

# 2. Instale dependências
npm install

# 3. Configure variáveis de ambiente
cp .env.example .env.local

# 4. Inicie o desenvolvimento
npm run dev

# 5. Em outro terminal, inicie Electron (opcional)
npm run build:electron
npm start:electron
```

### Configurar IDE (VSCode)

**Extensões Recomendadas:**

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "Vue.volar",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-react"
  ]
}
```

**Arquivo `.vscode/settings.json`:**

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true
  }
}
```

---

## 📁 Estrutura do Projeto

### Organização de Pastas

```
src/
├── components/
│   ├── Flashcards/           # Componentes de flashcards
│   ├── MindMap/              # Componentes de mapa mental
│   ├── documents/            # Leitores de documentos
│   ├── notes/                # Componentes de notas
│   ├── overlay/              # Overlays e modais
│   ├── shell/                # Shell components (layout)
│   ├── tools/                # Ferramentas (downloads, todo)
│   ├── ui/                   # Design system
│   └── views/                # Páginas principais
├── contexts/                 # React Context API
├── core/                     # Lógica de negócio
├── hooks/                    # Custom hooks
├── services/                 # Serviços (API, DB)
├── utils/                    # Funções utilitárias
├── types.ts                  # Tipos globais
└── App.tsx                   # Componente raiz
```

### Padrão de Componente

```typescript
// src/components/Example/ExampleComponent.tsx
import React, { FC, useState, useEffect } from 'react';
import { Icon } from '../ui/Icon';

interface ExampleComponentProps {
  title: string;
  onClose?: () => void;
}

const ExampleComponent: FC<ExampleComponentProps> = ({ title, onClose }) => {
  const [state, setState] = useState<string>('');

  useEffect(() => {
    // Setup
    return () => {
      // Cleanup
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4">
        <h1 className="text-lg font-bold">{title}</h1>
        {/* Content */}
      </div>
    </div>
  );
};

export default ExampleComponent;
```

---

## 💻 Desenvolvimento

### Scripts de Desenvolvimento

```bash
# Inicia servidor Vite (hot reload)
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Lint (ESLint)
npm run lint
npm run lint:fix

# Formatação (Prettier)
npm run format
npm run format:check

# Build Electron
npm run build:electron

# Iniciar aplicação Electron
npm start:electron

# Criar instaladores e distros
npm run dist
```

### Hot Module Replacement (HMR)

O Vite suporta HMR por padrão. Quando você edita um arquivo:

```typescript
// React component
File saved → Estado preservado → Component atualizado
```

Para desativar, edite `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    hmr: false
  }
})
```

### Adicionando uma Nova Feature

1. **Crie a pasta da feature:**
   ```
   src/components/features/nova-feature/
   ├── components/
   ├── hooks/
   ├── types.ts
   └── index.ts
   ```

2. **Crie o tipo TypeScript:**
   ```typescript
   // src/components/features/nova-feature/types.ts
   export interface NovaFeatureState {
     id: string;
     name: string;
     data: unknown;
   }
   ```

3. **Crie o Context (se precisar estado global):**
   ```typescript
   // src/contexts/NovaFeatureContext.tsx
   ```

4. **Crie os componentes:**
   ```typescript
   // src/components/features/nova-feature/NovaFeature.tsx
   ```

5. **Export no index:**
   ```typescript
   // src/components/features/nova-feature/index.ts
   export { default } from './NovaFeature';
   export * from './types';
   ```

---

## 🧪 Testing

### Estrutura de Testes

```
tests/
├── unit/
│   ├── utils/
│   └── services/
├── components/
│   └── notes/
└── integration/
```

### Escrevendo Testes

```typescript
// tests/unit/utils/formatDate.test.ts
import { describe, it, expect } from 'vitest';
import { formatDate } from '@/utils/formatDate';

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-04-08');
    expect(formatDate(date)).toBe('08/04/2024');
  });

  it('should handle invalid dates', () => {
    expect(formatDate(null)).toBe('');
  });
});
```

### Rodando Testes

```bash
# Rodar todos os testes
npm run test

# Modo watch
npm run test -- --watch

# Com cobertura
npm run test -- --coverage

# Teste específico
npm run test -- formatDate.test.ts
```

---

## 🐛 Debugging

### DevTools React

1. Instale [React Developer Tools](https://react.devtools.io/)
2. Abra o DevTools do navegador
3. Vá para a aba "Components"

### DevTools Electron

```typescript
// main.ts
const mainWindow = createWindow();

if (isDevelopment) {
  mainWindow.webContents.openDevTools();
}
```

### Debugger VSCode

Crie `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Electron",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
      "runtimeArgs": ["."],
      "cwd": "${workspaceFolder}",
      "protocol": "inspector",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"]
    }
  ]
}
```

### Logs

```typescript
// Usar para debugging
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}

// Ou use biblioteca de logs
import { logger } from '@/utils/logger';
logger.debug('Event:', event);
```

---

## ⚡ Performance

### Bundle Analysis

```bash
npm run analyze
```

### Performance Tips

1. **Code Splitting:**
   ```typescript
   const HeavyComponent = React.lazy(() => import('./Heavy'));
   
   export default function App() {
     return (
       <Suspense fallback={<Loading />}>
         <HeavyComponent />
       </Suspense>
     );
   }
   ```

2. **Memoization:**
   ```typescript
   const MemoComponent = React.memo(Component);
   ```

3. **useCallback:**
   ```typescript
   const handleClick = useCallback(() => {
     // ...
   }, [dependency]);
   ```

4. **useMemo:**
   ```typescript
   const expensiveValue = useMemo(() => {
     return computeExpensiveValue(a, b);
   }, [a, b]);
   ```

---

## 🚀 Deployment

### Build para Produção

```bash
# Web
npm run build
# Output: dist-vite/

# Desktop
npm run build:electron
npm run dist
# Output: out/ (instaladores)
```

### Deploy no Vercel

```bash
# Instale Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production
vercel --prod
```

### Deploy Manual

```bash
# Build
npm run build

# Upload dist-vite/ para seu servidor
# Ou configure auto-deploy via GitHub Pages/Netlify
```

---

## 📚 Recursos

- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Electron Docs](https://www.electronjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/)

---

## ❓ FAQ Desenvolvimento

**P: Como adiciono uma nova dependência?**
```bash
npm install nova-dependencia
```

**P: Como removo uma dependência?**
```bash
npm uninstall dependencia
```

**P: Como atualizo dependências?**
```bash
npm update
npm audit fix  # Para vulnerabilidades
```

**P: Como reseto tudo e começo do zero?**
```bash
rm -rf node_modules package-lock.json
npm install
```

**P: Como posso ver o que mudou no código?**
```bash
git diff
git log --oneline
```

---

**Precisa de ajuda?** Abra uma [Issue](https://github.com/seu-usuario/hub-study-browser/issues) ou visite a [Documentação Completa](../GUIA_PROFISSIONALIZACAO.md).
