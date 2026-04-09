# 🏗️ Arquitetura do Projeto

Uma visão técnica da arquitetura e fluxos de dados do HUB Study Browser.

## 📊 Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron Window                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              React Application (Renderer)             │ │
│  │                                                        │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  UI Components                                    │ │ │
│  │  │  ├─ Views (Notes, Flashcards, MindMap, etc)    │ │ │
│  │  │  ├─ Shell (Sidebar, TabBar, AddressBar)       │ │ │
│  │  │  └─ UI System (Buttons, Icons, Menus)         │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │                        ↑↓                              │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  React Context API (State Management)           │ │ │
│  │  │  ├─ NotesContext                                │ │ │
│  │  │  ├─ FlashcardContext                            │ │ │
│  │  │  ├─ MindMapContext                              │ │ │
│  │  │  └─ DocumentContext                             │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │                        ↓                               │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  Services & Utilities                            │ │ │
│  │  │  ├─ Database Service (IndexedDB)               │ │ │
│  │  │  ├─ Search Service (Searx)                     │ │ │
│  │  │  ├─ Gemini Service (AI)                        │ │ │
│  │  │  └─ Utils & Helpers                            │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                        ↓ IPC                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │      Electron Main Process                            │ │
│  │      ├─ Window Management                             │ │
│  │      ├─ File System Access                            │ │
│  │      └─ OS Integration                                │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
          ↓ Network Layer
     ┌─────────────────┐
     │  External APIs  │
     ├─────────────────┤
     │ • Google Gemini │
     │ • Searx         │
     │ • Downloads     │
     └─────────────────┘
```

---

## 🔄 Fluxo de Dados

### Fluxo de Criação de Nota

```
User Input
  ↓
BlockEditor Component
  ↓
NotesContext.addNote()
  ↓
Database Service (IndexedDB)
  ↓
Local Storage Persistence
  ↓
UI Update via Context
```

### Fluxo de Estudo com Flashcards

```
User Starts Study
  ↓
FlashcardContext loads deck
  ↓
SRS Algorithm calculates next card
  ↓
Card displayed to user
  ↓
User answers (Easy/Good/Hard)
  ↓
Update spaced repetition schedule
  ↓
Save to IndexedDB
  ↓
Display next card or statistics
```

### Fluxo de Busca

```
User types query
  ↓
Search Service triggered
  ↓
Query sent to Searx instance
  ↓
Results parsed
  ↓
Displayed in UI
  ↓
User can open in browser tab
```

---

## 💾 Armazenamento de Dados

### IndexedDB Schema

```javascript
// Notes Store
{
  id: string (key),
  title: string,
  content: Block[],
  folder: string,
  tags: string[],
  createdAt: number,
  updatedAt: number,
  isFavorite: boolean,
  isDeleted: boolean,
  deletedAt?: number
}

// Flashcards Store
{
  id: string (key),
  deckId: string,
  question: string,
  answer: string,
  image?: string,
  audio?: Blob,
  interval: number,
  easeFactor: number,
  nextReview: number,
  reviews: ReviewHistory[]
}

// MindMaps Store
{
  id: string (key),
  title: string,
  nodes: Node[],
  connections: Connection[],
  layout: LayoutData,
  createdAt: number,
  updatedAt: number
}
```

---

## 🎯 Padrões e Conventions

### Component Naming
- Componentes: `PascalCase` → `NotesCanvas.tsx`
- Pastas: `lowercase` → `src/components/notes/`

### State Management
- **Global State**: React Context
- **Local State**: useState hook
- **Persistent State**: IndexedDB
- **Temporary State**: Local useState

### Hook Conventions
- Use `useXXX` nomenclature
- Mantenha hooks pequenos e focados
- Extraia lógica complexa para custom hooks

### File Structure
```
Feature/
├── components/      # Componentes React
├── hooks/          # Custom hooks (opcional)
├── types.ts        # Tipos TypeScript
├── constants.ts    # Constantes (opcional)
└── index.ts        # Exports
```

---

## 🔐 Segurança

### Tratamento de Dados
- Nenhum dado sensível no localStorage (não encriptado)
- API keys mantidas em `.env.local`
- Variáveis `VITE_*` são expostas ao cliente
- Dados de usuário são apenas locais (não enviados para servidor)

### Electron Security
- Preload scripts para IPC seguro
- Context isolation habilitado
- Node integration desabilitado
- Sandbox habilitado

---

## 🚀 Performance

### Code Splitting
Vite/React automaticamente fazem code splitting:
```typescript
// Lazy loading automaticamente funciona em rotas
const NotesView = lazy(() => import('./views/NotesView'));
```

### Otimizações
1. **Memoization**: `React.memo()` para componentes pesados
2. **useCallback**: Previne re-renders desnecessários
3. **useMemo**: Cache de valores computacionais
4. **IndexedDB Index**: Índices para queries rápidas

### Bundle Size
- TypeScript compilado para JavaScript
- Tailwind CSS purificado (apenas classes usadas)
- Tree-shaking automático de imports não usados

---

## 📱 Responsividade

### Breakpoints (Tailwind)
```
mobile: < 640px
tablet: 640px - 1024px
desktop: > 1024px
```

### Componentes Responsivos
- Canvas hidden no mobile (`hidden md:block`)
- List view primary no mobile
- Touch-friendly no mobile

---

## 🔌 Integração com APIs

### Google Gemini
```typescript
// services/geminiService.ts
async generateNote(prompt: string): Promise<string>
async suggestTags(content: string): Promise<string[]>
```

### Searx
```typescript
// services/searchService.ts
async search(query: string): Promise<SearchResult[]>
```

---

## 📦 Dependências Principais

```json
{
  "react": "^18.x",              // UI Framework
  "vite": "^7.x",                // Build tool
  "typescript": "^5.x",          // Type safety
  "tailwindcss": "^3.x",         // Styling
  "electron": "^39.x",           // Desktop
  "react-dnd": "^?.x"            // Drag & Drop (opcional - consider)
}
```

---

## 🧪 Testing Architecture

### Unit Tests
```typescript
// test/unit/utils/formatDate.test.ts
describe('formatDate', () => {
  it('should format correctly', () => {
    // Testa funções puras
  });
});
```

### Component Tests
```typescript
// test/components/Note.test.tsx
describe('Note Component', () => {
  it('should render note content', () => {
    // Testa renderização
  });
});
```

---

## 🔄 CI/CD Pipeline

```
Git Push
  ↓
GitHub Actions Triggered
  ↓
├─ Lint (ESLint)
├─ Format Check (Prettier)
├─ Unit Tests
├─ Build Web
└─ Build Electron
  ↓
On Tag Push (Release)
  ↓
├─ Build Distributions
├─ Create GitHub Release
└─ Publish Artifacts
```

---

## 📚 Extensibilidade

### Como adicionar nova feature:

1. **Criar folder estruturado**
   ```
   src/components/features/nova-feature/
   ```

2. **Criar tipos**
   ```typescript
   // types.ts
   export interface NovaFeatureState { }
   ```

3. **Criar Context (se precisar estado global)**
   ```typescript
   // NovaFeatureContext.tsx
   ```

4. **Criar componentes**
   ```typescript
   // NovaFeatureView.tsx
   ```

5. **Export no index**
   ```typescript
   // index.ts
   export { default } from './NovaFeatureView';
   ```

6. **Integrar na View principal**
   ```typescript
   // App.tsx
   import NovaFeatureView from './components/features/nova-feature';
   ```

---

## 🎓 Recursos para Desenvolvedores

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Electron Docs](https://www.electronjs.org/docs)

---

## ⚙️ Configurações Importantes

### `vite.config.ts`
```typescript
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    minify: 'terser'
  }
});
```

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

---

Última atualização: 2024-04-08
Mantido por: [Seu Nome](https://github.com/seu-usuario)
