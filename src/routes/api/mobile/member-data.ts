import { createFileRoute } from '@tanstack/react-router';
import { getMemberAppDataForToken } from '@/lib/member-data.server';
import {
  assertMobileOrigin,
  bearerToken,
  mobileError,
  mobileJson,
  mobilePreflight,
} from '@/lib/mobile-api.server';

export const Route = createFileRoute('/api/mobile/member-data')({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => mobilePreflight(request),
      POST: async ({ request }) => {
        try {
          assertMobileOrigin(request);
          const idToken = bearerToken(request);
          const data = await getMemberAppDataForToken(idToken);
          return mobileJson(request, data);
        } catch (error) {
          return mobileError(request, error);
        }
      },
    },
  },
});
