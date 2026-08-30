import { createFileRoute } from '@tanstack/react-router';
import AppShell from '@/components/AppShell';
import CommunicationsPage from '@/components/pages/Communications';

export const Route = createFileRoute('/comunicados')({
  head: () => ({
    meta: [
      { title: 'Comunicados — Oitava Music Betim' },
      { name: 'description', content: 'Comunicados enviados pela liderança do ministério.' },
    ],
  }),
  component: () => (
    <AppShell allowMember>
      <CommunicationsPage />
    </AppShell>
  ),
});
