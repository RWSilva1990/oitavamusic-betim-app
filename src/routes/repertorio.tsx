import { createFileRoute } from "@tanstack/react-router";
import AppShell from "@/components/AppShell";
import Page from "@/components/pages/Songs";

export const Route = createFileRoute("/repertorio")({
  head: () => ({
    meta: [
      { title: "Repertório — Oitava Music Betim" },
      { name: "description", content: "Repertório de músicas com links, BPM e áudios de voz para estudo." },
      { property: "og:title", content: "Repertório — Oitava Music Betim" },
      { property: "og:description", content: "Repertório de músicas com links, BPM e áudios de voz para estudo." },
    ],
  }),
  component: () => (
    <AppShell allowMember>
      <Page />
    </AppShell>
  ),
});
