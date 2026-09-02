import { createFileRoute } from "@tanstack/react-router";
import AppShell from "@/components/AppShell";
import Page from "@/components/pages/Metronome";

export const Route = createFileRoute("/metronomo")({
  head: () => ({
    meta: [
      { title: "Metrônomo — Oitava Music Betim" },
      { name: "description", content: "Metrônomo com BPM, Tap Tempo e seleção de compasso." },
      { property: "og:title", content: "Metrônomo — Oitava Music Betim" },
      { property: "og:description", content: "Metrônomo com BPM, Tap Tempo e seleção de compasso." },
    ],
  }),
  component: () => (
    <AppShell allowMember>
      <Page />
    </AppShell>
  ),
});
