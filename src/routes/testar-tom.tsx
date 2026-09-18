import { createFileRoute } from "@tanstack/react-router";
import AppShell from "@/components/AppShell";
import Page from "@/components/pages/SongKeyTester";

export const Route = createFileRoute("/testar-tom")({
  head: () => ({
    meta: [
      { title: "Testar tom de música — Oitava Music Betim" },
      { name: "description", content: "Escolha uma música do repertório e abra a referência diretamente no Transpose." },
    ],
  }),
  component: () => (
    <AppShell allowMember>
      <Page />
    </AppShell>
  ),
});
