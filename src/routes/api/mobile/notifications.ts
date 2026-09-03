import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import {
  getNotificationPreferencesForToken,
  notifyScaleEventForToken,
  saveNotificationPreferencesForToken,
} from '@/lib/notification-center.server';
import {
  assertMobileOrigin,
  bearerToken,
  MobileApiError,
  mobileError,
  mobileJson,
  mobilePreflight,
} from '@/lib/mobile-api.server';

const preferencesSchema = z.object({
  noticeScaleAdded: z.boolean(),
  noticeScaleRemoved: z.boolean(),
  noticeRoleChanged: z.boolean(),
  noticeRepertoireChanged: z.boolean(),
  noticeSongDetailsChanged: z.boolean(),
  reminder7Days: z.boolean(),
  reminder3Days: z.boolean(),
  reminder1Day: z.boolean(),
  reminderSameDay: z.boolean(),
});

const scaleSchema = z.object({
  id: z.string().min(1).max(160),
  name: z.string().trim().min(1).max(180),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const requestSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('get-preferences') }),
  z.object({ action: z.literal('save-preferences'), preferences: preferencesSchema }),
  z.object({
    action: z.literal('notify-scale-event'),
    type: z.enum(['scale-added', 'scale-removed', 'role-changed', 'repertoire-changed', 'song-details-changed']),
    scale: scaleSchema,
    memberIds: z.array(z.string().min(1).max(160)).max(300),
    detail: z.object({
      songName: z.string().trim().max(180).optional(),
      roleLabel: z.string().trim().max(180).optional(),
    }).optional(),
  }),
]);

export const Route = createFileRoute('/api/mobile/notifications')({
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
          if (parsed.data.action === 'get-preferences') {
            result = await getNotificationPreferencesForToken(idToken);
          } else if (parsed.data.action === 'save-preferences') {
            result = await saveNotificationPreferencesForToken(idToken, parsed.data.preferences);
          } else {
            result = await notifyScaleEventForToken(idToken, {
              type: parsed.data.type,
              scale: parsed.data.scale,
              memberIds: parsed.data.memberIds,
              detail: parsed.data.detail,
            });
          }

          return mobileJson(request, result);
        } catch (error) {
          return mobileError(request, error);
        }
      },
    },
  },
});
