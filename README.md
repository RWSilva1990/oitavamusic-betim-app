# Oitava Music Betim

Aplicativo de gestão do ministério de louvor, com escalas, grupos, repertório,
áudios, membros, convites e acesso individual.

## Stack

- React 19
- TanStack Start / TanStack Router
- Vite 8
- Nitro
- Firebase Authentication, Firestore e Storage
- Vercel para deploy

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
