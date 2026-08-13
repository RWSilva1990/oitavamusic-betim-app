# Regras de segurança — Firebase (Oitava Music Betim)

Publique cada bloco no console do Firebase.

Antes disso, confirme:

- **Authentication → Sign-in method:** E-mail/senha e Link de e-mail.
- **Authentication → Settings → Authorized domains:** domínio de produção usado em `APP_URL`.
- **Storage:** bucket ativo.

## Firestore → Regras

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return isSignedIn()
        && request.auth.token.email in ['rwsilvatec@gmail.com'];
    }

    // Estrutura atual do app: dados agrupados em documentos dentro de /oitava.
    match /oitava/{docId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Para adicionar outro administrador, inclua o e-mail na lista de `isAdmin()` e
na variável `ADMIN_EMAILS` do Vercel.

## Storage → Regras

```text
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isAdmin() {
      return request.auth != null
        && request.auth.token.email in ['rwsilvatec@gmail.com'];
    }

    match /repertorio/{songId}/{fileName} {
      allow read: if request.auth != null;

      allow create, update: if isAdmin()
        && request.resource.size < 25 * 1024 * 1024
        && request.resource.contentType.matches('audio/.*');

      // Em exclusões request.resource é nulo; a regra precisa ser separada
      // para permitir que o app remova de fato o arquivo do bucket.
      allow delete: if isAdmin();
    }

    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## Observações

- As senhas são gerenciadas pelo Firebase Authentication e não ficam nos
  documentos do Firestore.
- A regra administrativa usa a identidade autenticada do Firebase. O aplicativo
  não possui mais código/senha alternativa embutida no frontend.
- A estrutura atual ainda permite que qualquer membro autenticado leia os
  documentos compartilhados de `/oitava`. Uma futura etapa de privacidade pode
  separar os dados públicos dos membros (nome/função) dos dados pessoais
  (telefone, e-mail e aniversário).
