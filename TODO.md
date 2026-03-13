# TODO: Implementação de Atualização Automática via GitHub

## ✅ Plano Aprovado
- [x] Repo: kaio-damaceno/StudyHub (Windows/Linux/macOS)
- [x] UI elegante para updates
- [x] Usar electron-builder + electron-updater

## 📋 Passos Pendentes
- [x] 1. Instalar electron-updater (`npm install --save-dev electron-updater electron-log`)
- [x] 2. Editar package.json (adicionar publish config)
- [x] 3. Editar main.js (adicionar autoUpdater + IPC)
- [x] 4. Criar UpdateNotifier.tsx (UI elegante)
- [x] 5. Integrar IPC listener no App.tsx ou SettingsView (preload.js + UpdateNotifier context)
- [ ] 6. Testar: npm run dist → verificar release GitHub
- [ ] 7. Usuário setup: GITHUB_TOKEN + primeiro release

**Próximo**: Passo 1 - Instalar dependências
