# 🚀 Publicar Releases no GitHub

Guia para publicar seus instaladores no GitHub Releases.

## Por Que Usar GitHub Releases?

- ✅ Arquivos grandes são permitidos (sem limite de 100MB)
- ✅ Fácil para usuários fazerem download
- ✅ Histórico de versões mantido
- ✅ Suporte a múltiplas plataformas (Windows, Linux, macOS)
- ✅ Auto-update pode verificar novas versões automaticamente

---

## 📋 Pré-requisitos

1. Tag Git criada: `git tag v1.3.3`
2. Instaladores compilados:
   - `Study Hub Setup 1.3.3.exe` (Windows)
   - `Study Hub 1.3.3.AppImage` (Linux - opcional)
   - `study-hub-1.3.3.deb` (Linux Debian - opcional)

---

## 🔧 Passo a Passo

### 1. Criar Tag Git

```bash
# Criar e fazer push da tag
git tag v1.3.3
git push origin v1.3.3
```

### 2. Ir ao GitHub e Criar Release

1. Acesse: https://github.com/kaio-damaceno/StudyHub/releases
2. Clique em "Draft a new release"
3. Selecione a tag: `v1.3.3`
4. Título: `Study Hub v1.3.3`
5. Descrição:

```markdown
# Study Hub v1.3.3

## Novidades
- Melhorias de performance
- Correções de bugs
- Nova documentação

## Download

Escolha o instalador para seu sistema:

- **Windows 10/11**: Study Hub Setup 1.3.3.exe
- **Linux (AppImage)**: Study Hub 1.3.3.AppImage  
- **Linux (Debian/Ubuntu)**: study-hub-1.3.3.deb

## Instalação

[Veja o guia de instalação](https://github.com/kaio-damaceno/StudyHub#-instalação)

## Nota

Para atualizar de uma versão anterior, faça logout dos dados locais ou crie um backup.
```

### 3. Upload dos Arquivos

Clique em "Attach binaries by dropping them here or selecting them" e selecione:

1. `dist/Study Hub Setup 1.3.3.exe`
2. `dist/Study Hub 1.3.3.AppImage` (se compilado)
3. `dist/study-hub-1.3.3.deb` (se compilado)

### 4. Publicar Release

✅ Clique em "Publish release"

---

## 📝 Template de Release Notes

```markdown
# Study Hub v[VERSION]

## ✨ Novidades
- Funcionalidade X
- Melhoria Y

## 🐛 Correções
- Bug A resolvido
- Bug B resolvido

## 📦 Download

| Sistema | Link |
|---------|------|
| Windows | Study-Hub-Setup-[VERSION].exe |
| Linux AppImage | Study-Hub-[VERSION].AppImage |
| Linux (apt) | study-hub-[VERSION].deb |

## 📖 Documentação

- [Guia de Instalação](releases/README.md)
- [Guia Rápido](docs/guias/GUIA_RAPIDO.md)
- [Wiki Completa](WIKI.md)

## 🔔 Próximas Versões

Acompanhe [Roadmap](ROADMAP.md) para saber o que vem por aí.
```

---

## ⚙️ Configurar Auto-Update

Para que o seu aplicativo verifice automaticamente novas versões:

1. Versão já está configurada em `main.js`
2. Usuários receberão notificação de atualização
3. Download e instalação automática em background

---

## 🔍 Verificar Release

1. Acesse: https://github.com/kaio-damaceno/StudyHub/releases/tag/v1.3.3
2. Confirme que arquivos estão disponíveis
3. Baixe um para testar (deve estar funcional)

---

## 📝 Comandos Rápidos

```bash
# Listar tags
git tag

# Criar nova tag
git tag v1.3.4
git push origin v1.3.4

# Deletar tag (se precisar corrigir)
git tag -d v1.3.3
git push origin --delete v1.3.3
```

---

## ❓ Troubleshooting

**P: Github não deixa fazer upload de arquivo > 100MB**  
R: Use GitHub Releases (não o repositório). Na página de releases, arraste os arquivos.

**P: Como atualizar uma release já publicada?**  
R: Delete e crie uma nova, ou edite (não recomendado para versões públicas).

**P: Auto-update não está funcionando**  
R: Verifique se o app está buscando releases corretas. Log em `%APPDATA%/study-hub/logs/`

---

<div align="center">

[← Voltar](../REPO_STRUCTURE.md)

</div>
