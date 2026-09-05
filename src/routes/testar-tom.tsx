import { createFileRoute } from "@tanstack/react-router";
import AppShell from "@/components/AppShell";
import Page from "@/components/pages/SongKeyTester";

export const Route = createFileRoute("/testar-tom")({
  head: () => ({
    meta: [
      { title: "Testar tom de música — Oitava Music Betim" },
      { name: "description", content: "Abra músicas do repertório no Transpose para testar outros tons." },
      { property: "og:title", content: "Testar tom de música — Oitava Music Betim" },
      { property: "og:description", content: "Abra músicas do repertório no Transpose para testar outros tons." },
    ],
  }),
  component: () => (
    <AppShell allowMember>
      <Page />
    </AppShell>
  ),
});
