import { createFileRoute } from "@tanstack/react-router";
import AppShell from "@/components/AppShell";
import Page from "@/components/pages/Members";

export const Route = createFileRoute("/membros")({
  head: () => ({
    meta: [
      { title: "Membros — Oitava Music Betim" },
      { name: "description", content: "Cadastro de membros, funções e convites de acesso do ministério." },
      { property: "og:title", content: "Membros — Oitava Music Betim" },
      { property: "og:description", content: "Cadastro de membros, funções e convites de acesso do ministério." },
    ],
  }),
  component: () => (
    <AppShell>
      <Page />
    </AppShell>
  ),
});
