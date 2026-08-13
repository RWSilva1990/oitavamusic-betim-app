import { createFileRoute } from "@tanstack/react-router";
import AppShell from "@/components/AppShell";
import Page from "@/components/pages/Scales";

export const Route = createFileRoute("/escalas")({
  head: () => ({
    meta: [
      { title: "Escalas — Oitava Music Betim" },
      { name: "description", content: "Montagem e compartilhamento das escalas de louvor." },
      { property: "og:title", content: "Escalas — Oitava Music Betim" },
      { property: "og:description", content: "Montagem e compartilhamento das escalas de louvor." },
    ],
  }),
  component: () => (
    <AppShell>
      <Page />
    </AppShell>
  ),
});
