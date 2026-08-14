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

    // O e-mail principal permanece como fallback administrativo.
    // Outros administradores são definidos em /accessUsers/{email}
    // com role = 'admin'.
    function isAdmin() {
      return isSignedIn()
        && (
          request.auth.token.email in ['rwsilvatec@gmail.com']
          || (
            exists(/databases/$(database)/documents/accessUsers/$(request.auth.token.email))
            && get(/databases/$(database)/documents/accessUsers/$(request.auth.token.email)).data.role == 'admin'
          )
        );
    }

    function isMember() {
      return isSignedIn()
        && request.auth.token.email_verified == true
        && exists(/databases/$(database)/documents/accessUsers/$(request.auth.token.email))
        && get(/databases/$(database)/documents/accessUsers/$(request.auth.token.email)).data.role == 'membro'
        && get(/databases/$(database)/documents/accessUsers/$(request.auth.token.email)).data.memberId is string;
    }

    function isAuthorized() {
      return isAdmin() || isMember();
    }

    // Dados principais do app: administradores e membros vinculados leem.
    // Apenas administradores gravam nos documentos compartilhados.
    match /oitava/{docId} {
      allow read: if isAuthorized();
      allow write: if isAdmin();
    }

    // Cada usuário pode ler o próprio vínculo. Administradores podem consultar
    // e gerenciar a coleção, inclusive para aprovação e sincronização de acessos.
    match /accessUsers/{email} {
      allow read: if isSignedIn()
        && (request.auth.token.email == email || isAdmin());
      allow create, update, delete: if isAdmin();
    }

    // Cadastro preenchido pela própria pessoa convidada.
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

## Storage → Regras

```text
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    function isAdmin() {
      return request.auth != null
        && (
          request.auth.token.email in ['rwsilvatec@gmail.com']
          || (
            firestore.exists(
              /databases/(default)/documents/accessUsers/$(request.auth.token.email)
            )
            && firestore.get(
              /databases/(default)/documents/accessUsers/$(request.auth.token.email)
            ).data.role == 'admin'
          )
        );
    }

    function isMember() {
      return request.auth != null
        && request.auth.token.email_verified == true
        && firestore.exists(
          /databases/(default)/documents/accessUsers/$(request.auth.token.email)
        )
        && firestore.get(
          /databases/(default)/documents/accessUsers/$(request.auth.token.email)
        ).data.role == 'membro'
        && firestore.get(
          /databases/(default)/documents/accessUsers/$(request.auth.token.email)
        ).data.memberId is string;
    }

    function isAuthorized() {
      return isAdmin() || isMember();
    }

    match /repertorio/{songId}/{fileName} {
      allow read: if isAuthorized();

      allow create, update: if isAdmin()
        && request.resource.size < 25 * 1024 * 1024
        && request.resource.contentType.matches('audio/.*');

      allow delete: if isAdmin();
    }

    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

> O Storage Security Rules consulta o mesmo documento individual de acesso usado
> pelo Firestore. Leituras feitas pelas regras podem contar para cota/faturamento
> do Firestore. Chamadas repetidas ao mesmo documento podem ser armazenadas em cache.

## Como promover um membro a administrador

No console do Firebase, abra **Firestore Database → Dados → accessUsers** e localize
o documento cujo ID é o e-mail do membro.

Altere apenas:

```text
role: "membro"
```

para:

```text
role: "admin"
```

Mantenha `email` e `memberId` existentes. Para remover o acesso administrativo,
basta voltar `role` para `"membro"`.

O e-mail `rwsilvatec@gmail.com` permanece como administrador principal por meio da
configuração do aplicativo e das regras, independentemente do documento em
`accessUsers`.

## Observações

- As senhas são gerenciadas pelo Firebase Authentication e não ficam nos documentos do Firestore.
- O login aceita como administrador tanto o e-mail principal configurado quanto um documento válido em `/accessUsers/{email}` com `role: "admin"`.
- Membros comuns continuam exigindo `role: "membro"` e um `memberId` válido.
- O convite de novo membro continua separado. O documento em `/accessUsers/{email}` só é criado quando o administrador aprova o cadastro.
- A sincronização de acessos preserva cadastros que já estejam marcados como `admin`.
- O documento legado `/oitava/users` continua existindo por compatibilidade, mas não é usado pelas Security Rules para decidir autorização.
