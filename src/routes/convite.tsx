import { createFileRoute } from "@tanstack/react-router";
import InvitePage from "@/components/pages/Invite";

export const Route = createFileRoute("/convite")({
  head: () => ({
    meta: [
      { title: "Ativar acesso — Oitava Music Betim" },
      { name: "description", content: "Defina sua senha pessoal e ative o acesso às suas escalas." },
      { property: "og:title", content: "Ativar acesso — Oitava Music Betim" },
      { property: "og:description", content: "Defina sua senha e ative o acesso às suas escalas." },
    ],
  }),
  component: InvitePage,
});
