import { createFileRoute } from '@tanstack/react-router';
import { readFirebasePublicConfig } from '@/lib/firebase-config.server';
import {
  assertMobileOrigin,
  mobileError,
  mobileJson,
  mobilePreflight,
} from '@/lib/mobile-api.server';

export const Route = createFileRoute('/api/mobile/config')({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => mobilePreflight(request),
      GET: async ({ request }) => {
        try {
          assertMobileOrigin(request);
          return mobileJson(request, readFirebasePublicConfig());
        } catch (error) {
          return mobileError(request, error);
        }
      },
    },
  },
});
