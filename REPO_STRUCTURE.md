# 📁 Estrutura do Repositório - Study Hub

```
study-hub/
│
├── 📄 README.md              ← COMECE AQUI - Visão geral
├── 📄 WIKI.md                ← Documentação completa
├── 📄 LICENSE                ← MIT License
├── 📄 package.json           ← Dependências (info apenas)
│
├── 📁 releases/              ← 📥 INSTALADORES
│   ├── Study Hub Setup 1.3.3.exe
│   ├── APPIMAGE_README.txt
│   └── README.md
│
├── 📁 docs/                  ← 📖 DOCUMENTAÇÃO
│   ├── README.md             ← Índice de docs
│   ├── guias/
│   │   ├── README.md
│   │   ├── GUIA_RAPIDO.md    ← Referência rápida
│   │   └── (outros guias em breve)
│   └── tutoriais/
│       ├── README.md
│       ├── PRIMEIROS_10_MINUTOS.md  ← Tutorial interativo
│       └── (mais tutoriais em breve)
│
├── 📁 [Código-fonte]         ← IGNORADO pelo .gitignore
│   ├── components/
│   ├── services/
│   ├── contexts/
│   ├── src/
│   └── (etc)
│
├── 📁 node_modules/          ← IGNORADO
│
├── 📁 dist/                  ← IGNORADO (builds locais)
│
└── .gitignore               ← Política: apenas público

═════════════════════════════════════════════════════════

✅ QUE MANUTEM NO REPOSITÓRIO:
  • README.md              - Página inicial
  • WIKI.md                - Documentação completa
  • LICENSE                - Termos de uso
  • docs/                  - Documentação de usuário
  • releases/              - Instaladores finais
  • package.json           - Informações do projeto

❌ QUE NÃO APARECEM NO REPOSITÓRIO:
  • Código-fonte (*.ts, *.tsx, *.js)
  • node_modules/          - Dependências
  • dist, build/, etc      - Builds locais
  • .env, .env.local       - Variáveis sensíveis
  • IDE config (.vscode/)  - Configurações locais
  • Logs e temporários

═════════════════════════════════════════════════════════

📍 PRÓXIMOS PASSOS:

1. Compilar para Linux:
   npm run dist:linux

2. Copiar instalador para releases/

3. Fazer commit e push

4. Publicar release no GitHub com os instaladores

═════════════════════════════════════════════════════════
