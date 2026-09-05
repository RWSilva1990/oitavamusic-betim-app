import { createFileRoute } from '@tanstack/react-router';
import AppShell from '@/components/AppShell';
import Page from '@/components/pages/TestSongKey';

export const Route = createFileRoute('/testar-tom')({
  head: () => ({
    meta: [
      { title: 'Testar tom de música — Oitava Music Betim' },
      { name: 'description', content: 'Abra uma música do repertório no Transpose para testar o tom.' },
    ],
  }),
  component: () => (
    <AppShell allowMember>
      <Page />
    </AppShell>
  ),
});
