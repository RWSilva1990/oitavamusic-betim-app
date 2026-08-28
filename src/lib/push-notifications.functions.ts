import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import {
  notifyScaleMembersAddedForToken,
  registerPushInstallationForToken,
  unregisterPushInstallationForToken,
} from './push-notifications.server';

const registerSchema = z.object({
  idToken: z.string().min(20),
  fid: z.string().min(8).max(600).optional(),
  token: z.string().min(8).max(4096).optional(),
}).superRefine((data, ctx) => {
  const targets = [data.fid, data.token].filter(Boolean);
  if (targets.length !== 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Informe exatamente um identificador de instalação.',
    });
  }
});

const unregisterSchema = registerSchema;

const notifySchema = z.object({
  idToken: z.string().min(20),
  scale: z.object({
    id: z.string().min(1).max(160),
    name: z.string().trim().min(1).max(180),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
  addedMemberIds: z.array(z.string().min(1).max(160)).max(300),
});

export const registerPushInstallation = createServerFn({ method: 'POST' })
  .validator(registerSchema)
  .handler(async ({ data }) =>
    registerPushInstallationForToken(data.idToken, { fid: data.fid, token: data.token })
  );

export const unregisterPushInstallation = createServerFn({ method: 'POST' })
  .validator(unregisterSchema)
  .handler(async ({ data }) =>
    unregisterPushInstallationForToken(data.idToken, { fid: data.fid, token: data.token })
  );

export const notifyScaleMembersAdded = createServerFn({ method: 'POST' })
  .validator(notifySchema)
  .handler(async ({ data }) =>
    notifyScaleMembersAddedForToken(data.idToken, data.scale, data.addedMemberIds)
  );
