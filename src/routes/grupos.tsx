import { createFileRoute } from "@tanstack/react-router";
import AppShell from "@/components/AppShell";
import Page from "@/components/pages/Groups";

export const Route = createFileRoute("/grupos")({
  head: () => ({
    meta: [
      { title: "Grupos — Oitava Music Betim" },
      { name: "description", content: "Grupos e formações do ministério de louvor." },
      { property: "og:title", content: "Grupos — Oitava Music Betim" },
      { property: "og:description", content: "Grupos e formações do ministério de louvor." },
    ],
  }),
  component: () => (
    <AppShell>
      <Page />
    </AppShell>
  ),
});
