# Oitava Music Betim

Aplicativo de gestão do ministério de louvor, com escalas, grupos, repertório,
áudios, membros, convites e acesso individual.

## Stack

- React 19
- TanStack Start / TanStack Router
- Vite 8
- Nitro
- Firebase Authentication, Firestore e Storage
- Capacitor / Android
- Vercel para deploy

## Estrutura principal

- `src/` — aplicação web e regras de interface
- `public/` — arquivos públicos e identidade visual
- `android/` — projeto Android gerado/gerenciado pelo Capacitor
- `native-shell/` — recursos específicos da experiência nativa
- `scripts/` — scripts auxiliares de build e branding
- `.github/workflows/` — automações de build e manutenção

## Desenvolvimento local

```bash
npm install
npm run dev
```

Crie um `.env.local` usando `.env.example` como referência.

## Vercel

O projeto usa o suporte oficial a TanStack Start + Nitro. No Vercel, cadastre as
variáveis de `.env.example` em **Project Settings → Environment Variables**.

O build padrão é:

```bash
npm run build
```

Não é necessário configurar uma Output Directory manualmente quando o Vercel
detectar o preset **TanStack Start**.

## Firebase

As regras sugeridas ficam em `firebase.rules.md`. Publique separadamente os
blocos de Firestore e Storage no console do Firebase.

Para os links de convite e redefinição de senha, o host configurado em `APP_URL`
precisa estar em **Authentication → Settings → Authorized domains**.

## Android

A versão Android usa Capacitor e possui dois workflows principais:

- `build-android-test-apk.yml` — geração de APK de teste
- `build-android-release-apk.yml` — geração do APK oficial assinado a partir da `main`

A identidade visual Android é gerada por `scripts/generate-android-branding.py`.
A fonte oficial do ícone é `public/icon-512.png`. O script preserva a proporção
visual validada do símbolo e trata o preenchimento do fundo do ícone adaptativo
sem ampliar a marca central.

## Fluxo de contribuição

A branch `main` deve permanecer como referência estável. Alterações devem ser
feitas em branches curtas e integradas por Pull Request. Depois do merge e da
validação, branches de correção ou feature já incorporadas podem ser removidas
para manter o repositório organizado.
