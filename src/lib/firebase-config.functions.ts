import { createServerFn } from '@tanstack/react-start';
import { readFirebasePublicConfig } from './firebase-config.server';

export const getFirebaseConfig = createServerFn({ method: 'GET' }).handler(async () =>
  readFirebasePublicConfig()
);
