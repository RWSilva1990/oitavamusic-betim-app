type AdminAppLike = {
  options: {
    projectId?: string;
    credential?: {
      getAccessToken?: () => Promise<{ access_token?: string }>;
    };
  };
};

function projectIdOf(app: AdminAppLike) {
  const projectId = app.options?.projectId?.trim();
  if (!projectId) throw new Error('Não foi possível identificar o projeto Firebase.');
  return projectId;
}

async function accessTokenOf(app: AdminAppLike) {
  const credential = app.options?.credential;
  if (!credential?.getAccessToken) throw new Error('A credencial do Firebase Admin não pode acessar o Firestore.');
  const token = await credential.getAccessToken();
  if (!token?.access_token) throw new Error('Não foi possível obter autorização para acessar o Firestore.');
  return token.access_token;
}

export async function firestoreRest(
  app: AdminAppLike,
  suffix: string,
  init: RequestInit = {},
  { allowNotFound = false }: { allowNotFound?: boolean } = {},
) {
  const projectId = projectIdOf(app);
  const token = await accessTokenOf(app);
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents${suffix}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  if (allowNotFound && response.status === 404) return null;

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = payload?.error?.message || payload?.error?.status || `HTTP ${response.status}`;
    throw new Error(`Firestore recusou a operação: ${detail}`);
  }
  return payload;
}

export function firestoreString(document: any, field: string) {
  const value = document?.fields?.[field]?.stringValue;
  return typeof value === 'string' ? value : '';
}

export function firestoreDocumentPath(document: any) {
  const name = typeof document?.name === 'string' ? document.name : '';
  const marker = '/documents/';
  const index = name.indexOf(marker);
  return index >= 0 ? name.slice(index + marker.length) : '';
}

export function stringFields(values: Record<string, string>) {
  return {
    fields: Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, { stringValue: value }]),
    ),
  };
}
