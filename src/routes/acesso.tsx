import { createFileRoute } from "@tanstack/react-router";
import AccessPage from "@/components/pages/Access";

export const Route = createFileRoute("/acesso")({
  head: () => ({
    meta: [
      { title: "Criar ou redefinir senha — Oitava Music Betim" },
      { name: "description", content: "Primeiro acesso e redefinição de senha dos membros do Oitava Music Betim." },
      { property: "og:title", content: "Criar ou redefinir senha — Oitava Music Betim" },
      { property: "og:description", content: "Confirme seu e-mail e defina sua senha de acesso ao Oitava Music Betim." },
    ],
  }),
  component: AccessPage,
});
