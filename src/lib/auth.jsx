import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getFirebaseAuth, loadFirebaseConfig } from './firebase';
import { dbGet, dbSet, normalizeStr } from './db';

const AuthCtx = createContext(null);

const INVITE_EMAIL_KEY = 'oitava:invite-email';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [adminEmails, setAdminEmails] = useState([]);
  const [directory, setDirectory] = useState({});

  useEffect(() => {
    let unsub = () => {};
    let alive = true;
    (async () => {
      const cfg = await loadFirebaseConfig();
      if (!alive) return;
      setAdminEmails(cfg.adminEmails || []);
      setConfigured(Boolean(cfg.configured));
      if (!cfg.configured) { setLoading(false); return; }
      const { auth, mod } = await getFirebaseAuth();
      unsub = mod.onAuthStateChanged(auth, (u) => {
        setUser(u);
        setLoading(false);
      });
    })().catch(() => setLoading(false));
    return () => { alive = false; unsub(); };
  }, []);

  useEffect(() => {
    if (!user) { setDirectory({}); return; }
    dbGet('users').then((d) => setDirectory(d || {})).catch(() => setDirectory({}));
  }, [user]);

  const email = user?.email?.toLowerCase() || null;
  const entry = email ? directory[email] : null;
  const role = !user ? null : adminEmails.includes(email) || entry?.role === 'admin' ? 'admin' : 'membro';

  const api = useMemo(
    () => ({
      user,
      email,
      role,
      loading,
      configured,
      isAdmin: role === 'admin',

      async signIn(mail, password) {
        const { auth, mod } = await getFirebaseAuth();
        await mod.signInWithEmailAndPassword(auth, mail.trim(), password);
      },

      async sendInvite(mail) {
        const clean = mail.trim().toLowerCase();
        const { auth, mod } = await getFirebaseAuth();
        const cfg = await loadFirebaseConfig();
        const origin = cfg.appUrl || window.location.origin;
        await mod.sendSignInLinkToEmail(auth, clean, {
          url: `${origin}/convite`,
          handleCodeInApp: true,
        });
        const users = (await dbGet('users')) || {};
        if (!users[clean]) users[clean] = { role: 'membro' };
        await dbSet('users', users);
        setDirectory(users);
      },

      isInviteLink() {
        return typeof window !== 'undefined' && window.location.href.includes('apiKey=');
      },

      async completeInvite(mail) {
        const clean = mail.trim().toLowerCase();
        const { auth, mod } = await getFirebaseAuth();
        if (!mod.isSignInWithEmailLink(auth, window.location.href)) {
          throw new Error('Link de convite inválido ou expirado.');
        }
        await mod.signInWithEmailLink(auth, clean, window.location.href);
        window.localStorage.removeItem(INVITE_EMAIL_KEY);
      },

      async definePassword(password) {
        const { auth, mod } = await getFirebaseAuth();
        if (!auth.currentUser) throw new Error('Sessão expirada.');
        await mod.updatePassword(auth.currentUser, password);
      },

      async resetPassword(mail) {
        const { auth, mod } = await getFirebaseAuth();
        const cfg = await loadFirebaseConfig();
        const origin = cfg.appUrl || window.location.origin;
        await mod.sendPasswordResetEmail(auth, mail.trim(), {
          url: `${origin}/entrar`,
        });
      },

      async logout() {
        const { auth, mod } = await getFirebaseAuth();
        await mod.signOut(auth);
      },

      memberFor(members) {
        if (!email) return null;
        const linked = entry?.memberId ? members.find((m) => m.id === entry.memberId) : null;
        return linked || members.find((m) => normalizeStr(m.email) === normalizeStr(email)) || null;
      },
    }),
    [user, email, role, loading, configured, entry]
  );

  return <AuthCtx.Provider value={api}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth precisa estar dentro de AuthProvider');
  return ctx;
}
