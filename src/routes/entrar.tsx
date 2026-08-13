import { createFileRoute } from "@tanstack/react-router";
import LoginPage from "@/components/pages/Login";

export const Route = createFileRoute("/entrar")({
  head: () => ({
    meta: [
      { title: "Entrar — Oitava Music Betim" },
      { name: "description", content: "Acesso dos membros do ministério de louvor com e-mail e senha." },
      { property: "og:title", content: "Entrar — Oitava Music Betim" },
      { property: "og:description", content: "Acesso dos membros do ministério com e-mail e senha." },
    ],
  }),
  component: LoginPage,
});
