import { createFileRoute } from "@tanstack/react-router";
import AppShell from "@/components/AppShell";
import MemberInvitePanel from "@/components/MemberInvitePanel";
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
  component: MembersRoute,
});

function MembersRoute() {
  return (
    <AppShell>
      <style>{`button[title="Convidar por e-mail"] { display: none !important; }`}</style>
      <div style={{ padding: "24px 24px 0", maxWidth: 860 }}>
        <MemberInvitePanel />
      </div>
      <Page />
    </AppShell>
  );
}
