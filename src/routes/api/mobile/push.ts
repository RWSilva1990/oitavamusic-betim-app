import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import {
  notifyScaleMembersAddedForToken,
  registerPushInstallationForToken,
  unregisterPushInstallationForToken,
} from '@/lib/push-notifications.server';
import {
  assertMobileOrigin,
  bearerToken,
  MobileApiError,
  mobileError,
  mobileJson,
  mobilePreflight,
} from '@/lib/mobile-api.server';

const targetSchema = z.object({
  fid: z.string().min(8).max(600).optional(),
  token: z.string().min(8).max(4096).optional(),
}).superRefine((data, ctx) => {
  if ([data.fid, data.token].filter(Boolean).length !== 1) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Informe exatamente um identificador de instalação.' });
  }
});

const scaleSchema = z.object({
  id: z.string().min(1).max(160),
  name: z.string().trim().min(1).max(180),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const requestSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('register'), target: targetSchema }),
  z.object({ action: z.literal('unregister'), target: targetSchema }),
  z.object({
    action: z.literal('notify-scale-added'),
    scale: scaleSchema,
    addedMemberIds: z.array(z.string().min(1).max(160)).max(300),
  }),
  z.object({
    action: z.literal('notify-scale-removed'),
    scale: scaleSchema,
    removedMemberIds: z.array(z.string().min(1).max(160)).max(300),
  }),
]);

export const Route = createFileRoute('/api/mobile/push')({
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

          let result;
          if (parsed.data.action === 'register') {
            result = await registerPushInstallationForToken(idToken, parsed.data.target);
          } else if (parsed.data.action === 'unregister') {
            result = await unregisterPushInstallationForToken(idToken, parsed.data.target);
          } else if (parsed.data.action === 'notify-scale-removed') {
            result = await notifyScaleMembersAddedForToken(
              idToken,
              parsed.data.scale,
              parsed.data.removedMemberIds,
              'removed',
            );
          } else {
            result = await notifyScaleMembersAddedForToken(
              idToken,
              parsed.data.scale,
              parsed.data.addedMemberIds,
              'added',
            );
          }

          return mobileJson(request, result);
        } catch (error) {
          return mobileError(request, error);
        }
      },
    },
  },
});
