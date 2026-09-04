import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { sendInvitationEmailForToken } from './invite-email.server';

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  idToken: z.string().min(20),
});

export const sendInvitationEmail = createServerFn({ method: 'POST' })
  .validator(inviteSchema)
  .handler(async ({ data }) => sendInvitationEmailForToken(data.email, data.idToken));
