import { createFileRoute } from "@tanstack/react-router";
import AppShell from "@/components/AppShell";
import MyScalesPage from "@/components/pages/MyScales";

export const Route = createFileRoute("/minhas-escalas")({
  head: () => ({
    meta: [
      { title: "Minhas Escalas — Oitava Music Betim" },
      { name: "description", content: "Veja as escalas em que você está inserido, com músicas, tons e áudios de voz." },
      { property: "og:title", content: "Minhas Escalas — Oitava Music Betim" },
      { property: "og:description", content: "Suas escalas, músicas, tons e áudios de voz." },
    ],
  }),
  component: () => (
    <AppShell allowMember>
      <MyScalesPage />
    </AppShell>
  ),
});
