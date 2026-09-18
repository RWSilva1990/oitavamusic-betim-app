import { createFileRoute } from "@tanstack/react-router";
import AppShell from "@/components/AppShell";
import Page from "@/components/pages/Tools";

export const Route = createFileRoute("/ferramentas")({
  head: () => ({ meta: [{ title: "Ferramentas — Oitava Music Betim" }, { name: "description", content: "Ferramentas de apoio do Oitava Music Betim." }] }),
  component: () => (<AppShell allowMember><Page /></AppShell>),
});
