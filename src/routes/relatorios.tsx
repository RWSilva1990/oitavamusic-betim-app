import { createFileRoute } from "@tanstack/react-router";
import AppShell from "@/components/AppShell";
import Page from "@/components/pages/Reports";

export const Route = createFileRoute("/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — Oitava Music Betim" },
      { name: "description", content: "Músicas mais escaladas por período." },
      { property: "og:title", content: "Relatórios — Oitava Music Betim" },
      { property: "og:description", content: "Músicas mais escaladas por período." },
    ],
  }),
  component: () => (
    <AppShell>
      <Page />
    </AppShell>
  ),
});
