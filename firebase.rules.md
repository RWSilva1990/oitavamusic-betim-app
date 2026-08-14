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
        && request.auth.token.email in ['rwsilvatec@gmail.com'];
    }

    // Cada membro autorizado possui um documento próprio em
    // /accessUsers/{email}. Isso permite que as Rules validem o acesso sem
    // depender do JSON legado armazenado em /oitava/users.
    function isMember() {
      return isSignedIn()
        && request.auth.token.email_verified == true
        && get(/databases/$(database)/documents/accessUsers/$(request.auth.token.email)).data.role == 'membro'
        && get(/databases/$(database)/documents/accessUsers/$(request.auth.token.email)).data.memberId is string;
    }

    function isAuthorized() {
      return isAdmin() || isMember();
    }

    // Dados principais do app: somente administradores e membros vinculados leem.
    // Apenas administradores gravam nos documentos compartilhados.
    match /oitava/{docId} {
      allow read: if isAuthorized();
      allow write: if isAdmin();
    }

    // Cada usuário pode ler apenas o próprio vínculo. Administradores podem
    // consultar e gerenciar a coleção para sincronizar os acessos.
    match /accessUsers/{email} {
      allow read: if isSignedIn()
        && (request.auth.token.email == email || isAdmin());
      allow create, update, delete: if isAdmin();
    }

    // Cadastro preenchido pela própria pessoa convidada.
    // O convidado ainda não possui accessUsers/memberId, então esta coleção
    // continua acessível somente ao próprio UID enquanto estiver pendente.
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
        && request.auth.token.email in ['rwsilvatec@gmail.com'];
    }

    // O Storage consulta o mesmo documento individual de acesso usado pelo
    // Firestore. O caminho precisa ser completo e variáveis usam $(...).
    function isMember() {
      return request.auth != null
        && request.auth.token.email_verified == true
        && firestore.get(/databases/(default)/documents/accessUsers/$(request.auth.token.email)).data.role == 'membro'
        && firestore.get(/databases/(default)/documents/accessUsers/$(request.auth.token.email)).data.memberId is string;
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

> O Storage Security Rules pode consultar documentos do Firestore com
> `firestore.get()`. O console pode pedir uma autorização IAM na primeira
> publicação; essa autorização já pode ter sido anexada anteriormente.

## Ordem segura de migração

1. Publique temporariamente regras de Firestore que mantenham `/oitava` legível
   para usuários autenticados e permitam ao administrador gravar em
   `/accessUsers/{email}`.
2. No app, execute **Membros → Sincronizar acessos**. Isso cria um documento
   individual para cada membro válido em `/accessUsers/{email}`.
3. Depois de confirmar a sincronização sem conflitos, publique as regras finais
   de Firestore acima.
4. Por último, publique as regras finais do Storage acima.

## Observações

- As senhas são gerenciadas pelo Firebase Authentication e não ficam nos
  documentos do Firestore.
- **Primeiro acesso / esqueci minha senha:** o link por e-mail autentica o
  endereço, mas somente e-mails com documento válido em `/accessUsers/{email}`
  conseguem acessar os dados do ministério.
- O convite de novo membro continua separado. O convidado pode preencher somente
  o próprio documento em `/memberRegistrations/{uid}`; o documento em
  `/accessUsers/{email}` só é criado quando o administrador aprova o cadastro.
- O documento legado `/oitava/users` continua existindo por compatibilidade, mas
  não é mais usado pelas Security Rules para decidir autorização.
- A regra administrativa usa a identidade autenticada do Firebase. O aplicativo
  não possui código/senha alternativa embutida no frontend.
