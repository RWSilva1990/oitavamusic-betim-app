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
        && request.auth.token.email in ['rwsilivatec@gmail.com'];
    }

    // Estrutura principal do app: dados agrupados em documentos dentro de /oitava.
    match /oitava/{docId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }

    // Cadastro preenchido pela própria pessoa convidada.
    // Cada usuário só pode criar/editar o próprio cadastro enquanto ele estiver pendente.
    match /memberRegistrations/{uid} {
      allow read: if isSignedIn() && (request.auth.uid == uid || isAdmin());

      allow create: if isSignedIn()
        && request.auth.uid == uid
        && request.resource.data.keys().hasOnly([
          'name', 'birthdate', 'phone', 'email', 'status', 'createdAt', 'updatedAt'
        ])
        && request.resource.data.name is string
        && request.resource.data.name.size() >= 3
        && request.resource.data.birthdate is string
        && request.resource.data.phone is string
        && request.resource.data.email == request.auth.token.email
        && request.resource.data.status == 'pending';

      allow update: if isAdmin()
        || (isSignedIn()
          && request.auth.uid == uid
          && request.resource.data.keys().hasOnly([
            'name', 'birthdate', 'phone', 'email', 'status', 'createdAt', 'updatedAt'
          ])
          && request.resource.data.email == request.auth.token.email
          && request.resource.data.status == 'pending');

      allow delete: if isAdmin();
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
        && request.auth.token.email in ['rwsilivatec@gmail.com'];
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
- O convite é enviado para um e-mail específico. O formulário de cadastro só
  pode gravar o documento cujo UID pertence à própria sessão autenticada e o
  e-mail gravado precisa ser o mesmo e-mail validado pelo Firebase.
- O cadastro preenchido pelo convidado fica com status `pending`. O administrador
  conclui a entrada na página Membros; nesse momento o registro é vinculado ao
  cadastro oficial e passa para `accepted`.
- A regra administrativa usa a identidade autenticada do Firebase. O aplicativo
  não possui código/senha alternativa embutida no frontend.
- A estrutura atual ainda permite que qualquer membro autenticado leia os
  documentos compartilhados de `/oitava`. Uma futura etapa de privacidade pode
  separar os dados públicos dos membros (nome/função) dos dados pessoais
  (telefone, e-mail e aniversário).
