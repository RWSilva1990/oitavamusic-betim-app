import { createFileRoute } from "@tanstack/react-router";
import AppShell from "@/components/AppShell";
import Page from "@/components/pages/PitchTest";

export const Route = createFileRoute("/testar-tom")({
  head: () => ({
    meta: [
      { title: "Testar tom de música — Oitava Music Betim" },
      { name: "description", content: "Selecione uma música do repertório e abra a referência do YouTube no Transpose." },
      { property: "og:title", content: "Testar tom de música — Oitava Music Betim" },
      { property: "og:description", content: "Selecione uma música do repertório e abra a referência do YouTube no Transpose." },
    ],
  }),
  component: () => (
    <AppShell allowMember>
      <Page />
    </AppShell>
  ),
});
