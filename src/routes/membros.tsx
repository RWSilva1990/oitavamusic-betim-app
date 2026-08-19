import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Send } from "lucide-react";
import AppShell from "@/components/AppShell";
import MemberInvitePanel from "@/components/MemberInvitePanel";
import Page from "@/components/pages/Members";
import { Btn } from "@/components/ui-kit";
import { sendResendTestEmail } from "@/lib/email-test.functions";
import { C } from "@/lib/theme";

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

function ResendTestPanel() {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const send = async () => {
    setSending(true);
    setMessage("");
    setSuccess(false);
    try {
      const result = await sendResendTestEmail();
      setSuccess(true);
      setMessage(`E-mail enviado para ${result.to}. Confira a caixa de entrada e o spam.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível enviar o e-mail de teste.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="card" style={{ marginTop: 12, marginBottom: 16, padding: 16, border: `1px solid ${C.accent}33` }}>
      <div style={{ fontWeight: 800, color: C.textPrimary, marginBottom: 5 }}>Teste do Resend</div>
      <div style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.6, marginBottom: 12 }}>
        Teste temporário. O envio vai somente para o primeiro endereço configurado em ADMIN_EMAILS.
      </div>
      <Btn disabled={sending} onClick={send}>
        <Send size={14} />{sending ? "Enviando..." : "Enviar e-mail de teste"}
      </Btn>
      {message && (
        <div style={{ marginTop: 12, fontSize: 12, lineHeight: 1.6, color: success ? C.success : C.danger }}>
          {message}
        </div>
      )}
    </div>
  );
}

function MembersRoute() {
  return (
    <AppShell>
      <style>{`button[title="Convidar por e-mail"] { display: none !important; }`}</style>
      <div style={{ padding: "24px 24px 0", maxWidth: 860 }}>
        <ResendTestPanel />
        <MemberInvitePanel />
      </div>
      <Page />
    </AppShell>
  );
}
