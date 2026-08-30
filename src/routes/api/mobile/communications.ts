import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import {
  listCommunicationsForToken,
  listSentCommunicationsForToken,
  markCommunicationReadForToken,
  sendCommunicationForToken,
} from '@/lib/communications.server';
import {
  assertMobileOrigin,
  bearerToken,
  MobileApiError,
  mobileError,
  mobileJson,
  mobilePreflight,
} from '@/lib/mobile-api.server';

const requestSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('inbox') }),
  z.object({
    action: z.literal('mark-read'),
    communicationId: z.string().min(1).max(160),
  }),
  z.object({ action: z.literal('sent') }),
  z.object({
    action: z.literal('send'),
    title: z.string().trim().min(1, 'Informe o título do comunicado.').max(140),
    message: z.string().trim().min(1, 'Informe a mensagem do comunicado.').max(4000),
    groupIds: z.array(z.string().min(1).max(160)).max(80),
    memberIds: z.array(z.string().min(1).max(160)).max(400),
  }),
]);

export const Route = createFileRoute('/api/mobile/communications')({
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
          if (parsed.data.action === 'inbox') {
            result = await listCommunicationsForToken(idToken);
          } else if (parsed.data.action === 'mark-read') {
            result = await markCommunicationReadForToken(idToken, parsed.data.communicationId);
          } else if (parsed.data.action === 'sent') {
            result = await listSentCommunicationsForToken(idToken);
          } else {
            result = await sendCommunicationForToken(idToken, parsed.data);
          }

          return mobileJson(request, result);
        } catch (error) {
          return mobileError(request, error);
        }
      },
    },
  },
});
