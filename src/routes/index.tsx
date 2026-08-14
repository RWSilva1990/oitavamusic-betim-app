import { createFileRoute } from "@tanstack/react-router";
import AppShell from "@/components/AppShell";
import HomePage from "@/components/pages/Home";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Oitava Music Betim — Ministério de Louvor" },
      { name: "description", content: "Escalas, repertório com áudios de voz e membros do ministério de louvor Oitava Music Betim." },
      { property: "og:title", content: "Oitava Music Betim — Ministério de Louvor" },
      { property: "og:description", content: "Escalas, repertório com áudios de voz e membros do ministério de louvor." },
    ],
  }),
  component: () => (
    <AppShell allowMember>
      <HomePage />
    </AppShell>
  ),
});
