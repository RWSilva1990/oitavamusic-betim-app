import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { getMemberAppDataForToken } from './member-data.server';

const memberDataSchema = z.object({
  idToken: z.string().min(20),
});

export const getMemberAppData = createServerFn({ method: 'POST' })
  .validator(memberDataSchema)
  .handler(async ({ data }) => getMemberAppDataForToken(data.idToken));
