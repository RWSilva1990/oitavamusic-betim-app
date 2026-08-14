# Regras de segurança — Firebase (Oitava Music Betim)

Publique cada bloco no console do Firebase.

Antes disso, confirme:

- **Authentication → Sign-in method:** E-mail/senha e Link de e-mail.
- **Authentication → Settings → Authorized domains:** domínio de produção/preview usado em `APP_URL`.
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

    // Um membro só é autorizado quando o e-mail autenticado está no diretório
    // /oitava/users e já está vinculado a um memberId.
    function isMember() {
      return isSignedIn()
        && request.auth.token.email_verified == true
        && request.auth.token.email in get(/databases/$(database)/documents/oitava/users).data
        && get(/databases/$(database)/documents/oitava/users).data[request.auth.token.email].role == 'membro'
        && get(/databases/$(database)/documents/oitava/users).data[request.auth.token.email].memberId is string;
    }

    function isAuthorized() {
      return isAdmin() || isMember();
    }

    // Dados principais do app: somente administradores e membros já vinculados leem.
    // Apenas administradores gravam nos documentos compartilhados.
    match /oitava/{docId} {
      allow read: if isAuthorized();
      allow write: if isAdmin();
    }

    // Cadastro preenchido pela própria pessoa convidada.
    // O convidado ainda não possui memberId, então esta coleção precisa continuar
    // acessível somente ao próprio UID enquanto o cadastro estiver pendente.
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

    // O Storage consulta o mesmo diretório de acessos do Firestore para impedir
    // que uma conta apenas autenticada, mas não vinculada, leia os áudios.
    function isMember() {
      return request.auth != null
        && request.auth.token.email_verified == true
        && request.auth.token.email in firestore.get(/databases/(default)/documents/oitava/users).data
        && firestore.get(/databases/(default)/documents/oitava/users).data[request.auth.token.email].role == 'membro'
        && firestore.get(/databases/(default)/documents/oitava/users).data[request.auth.token.email].memberId is string;
    }

    function isAuthorized() {
      return isAdmin() || isMember();
    }

    match /repertorio/{songId}/{fileName} {
      allow read: if isAuthorized();

      allow create, update: if isAdmin()
        && request.resource.size < 25 * 1024 * 1024
        && request.resource.contentType.matches('audio/.*');

      // Em exclusões request.resource é nulo; a regra precisa ser separada.
      allow delete: if isAdmin();
    }

    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

> Na primeira publicação de uma regra do Storage que usa `firestore.get()`, o
> Firebase pode pedir autorização para o Storage consultar o Firestore. Aceite
> essa vinculação no console. Essas consultas são feitas apenas ao banco
> Firestore `(default)`.

## Observações

- As senhas são gerenciadas pelo Firebase Authentication e não ficam nos
  documentos do Firestore.
- **Primeiro acesso / esqueci minha senha:** o link por e-mail autentica o
  endereço, mas somente e-mails já presentes em `/oitava/users` com `memberId`
  conseguem ler os dados compartilhados do app.
- O convite de novo membro continua separado. O convidado pode preencher somente
  o próprio documento em `/memberRegistrations/{uid}`; ele só ganha acesso aos
  dados do ministério depois que o administrador aprova o cadastro e vincula um
  `memberId`.
- A regra administrativa usa a identidade autenticada do Firebase. O aplicativo
  não possui código/senha alternativa embutida no frontend.
