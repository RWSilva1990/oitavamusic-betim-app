import { createFileRoute } from '@tanstack/react-router';
import { getAdminAppDataForToken, saveAdminAppDataForToken } from '@/lib/admin-data.server';
import {
  assertMobileOrigin,
  bearerToken,
  mobileError,
  mobileJson,
  mobilePreflight,
  MobileApiError,
} from '@/lib/mobile-api.server';

export const Route = createFileRoute('/api/mobile/admin-data')({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => mobilePreflight(request),
      POST: async ({ request }) => {
        try {
          assertMobileOrigin(request);
          const idToken = bearerToken(request);
          const body = await request.json().catch(() => ({}));
          const action = String(body?.action || 'load');

          if (action === 'load') {
            const data = await getAdminAppDataForToken(idToken);
            return mobileJson(request, data);
          }

          if (action === 'save') {
            const key = String(body?.key || '');
            const result = await saveAdminAppDataForToken(idToken, key, body?.data);
            return mobileJson(request, result);
          }

          throw new MobileApiError(400, 'Ação administrativa inválida.');
        } catch (error) {
          return mobileError(request, error);
        }
      },
    },
  },
});
