import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { sendInvitationEmailForToken } from '@/lib/invite-email.server';
import {
  assertMobileOrigin,
  bearerToken,
  MobileApiError,
  mobileError,
  mobileJson,
  mobilePreflight,
} from '@/lib/mobile-api.server';

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const Route = createFileRoute('/api/mobile/invite')({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => mobilePreflight(request),
      POST: async ({ request }) => {
        try {
          assertMobileOrigin(request);
          const idToken = bearerToken(request);
          const body = await request.json().catch(() => null);
          const parsed = bodySchema.safeParse(body);
          if (!parsed.success) {
            throw new MobileApiError(400, 'Informe um e-mail válido.');
          }

          const result = await sendInvitationEmailForToken(parsed.data.email, idToken);
          return mobileJson(request, result);
        } catch (error) {
          return mobileError(request, error);
        }
      },
    },
  },
});
