import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import {
  acceptRegistrationForToken,
  listRegistrationsForToken,
  submitRegistrationForToken,
} from '@/lib/registration.server';
import {
  assertMobileOrigin,
  bearerToken,
  MobileApiError,
  mobileError,
  mobileJson,
  mobilePreflight,
} from '@/lib/mobile-api.server';

const requestSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('submit'),
    profile: z.object({
      name: z.string().trim().min(3).max(180),
      birthdate: z.string().trim().min(1).max(20),
      phone: z.string().trim().min(3).max(40),
    }),
  }),
  z.object({ action: z.literal('list') }),
  z.object({ action: z.literal('accept'), uid: z.string().min(1).max(160) }),
]);

export const Route = createFileRoute('/api/mobile/registration')({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => mobilePreflight(request),
      POST: async ({ request }) => {
        try {
          assertMobileOrigin(request);
          const idToken = bearerToken(request);
          const body = await request.json().catch(() => null);
          const parsed = requestSchema.safeParse(body);
          if (!parsed.success) {
            throw new MobileApiError(400, parsed.error.issues[0]?.message || 'Dados inválidos.');
          }

          if (parsed.data.action === 'submit') {
            return mobileJson(request, await submitRegistrationForToken(idToken, parsed.data.profile));
          }
          if (parsed.data.action === 'list') {
            return mobileJson(request, await listRegistrationsForToken(idToken));
          }
          return mobileJson(request, await acceptRegistrationForToken(idToken, parsed.data.uid));
        } catch (error) {
          return mobileError(request, error);
        }
      },
    },
  },
});
