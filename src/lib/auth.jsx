import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getFirebaseAuth, getFirebaseFirestore, loadFirebaseConfig } from './firebase';
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
        auth.languageCode = 'pt-BR';
        const cfg = await loadFirebaseConfig();
        const origin = (cfg.appUrl || window.location.origin).replace(/\/$/, '');
        const continueUrl = `${origin}/convite`;
        try {
          await mod.sendSignInLinkToEmail(auth, clean, {
            url: continueUrl,
            handleCodeInApp: true,
          });
        } catch (error) {
          if (error?.code === 'auth/unauthorized-continue-uri') {
            throw new Error(`Firebase recusou o domínio de retorno. URL usada: ${continueUrl}`);
          }
          throw error;
        }
        const users = (await dbGet('users')) || {};
        if (!users[clean]) users[clean] = { role: 'membro' };
        await dbSet('users', users);
        setDirectory(users);
      },

      async syncMemberDirectory(members) {
        if (role !== 'admin') throw new Error('Apenas administradores podem sincronizar acessos.');

        const users = (await dbGet('users')) || {};
        const emailOwners = new Map();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        for (const member of members || []) {
          const clean = String(member?.email || '').trim().toLowerCase();
          if (!clean) continue;
          const owners = emailOwners.get(clean) || [];
          owners.push(member);
          emailOwners.set(clean, owners);
        }

        const duplicateEmails = new Set(
          [...emailOwners.entries()].filter(([, owners]) => owners.length > 1).map(([mail]) => mail),
        );

        const result = {
          total: (members || []).length,
          linked: 0,
          alreadyLinked: 0,
          withoutEmail: 0,
          invalidEmail: 0,
          duplicates: duplicateEmails.size,
          conflicts: 0,
          duplicateEmails: [...duplicateEmails],
          conflictEmails: [],
        };

        let changed = false;
        for (const member of members || []) {
          const clean = String(member?.email || '').trim().toLowerCase();
          if (!clean) { result.withoutEmail += 1; continue; }
          if (!emailRegex.test(clean)) { result.invalidEmail += 1; continue; }
          if (duplicateEmails.has(clean)) continue;

          const existing = users[clean];
          if (existing?.memberId && existing.memberId !== member.id) {
            result.conflicts += 1;
            result.conflictEmails.push(clean);
            continue;
          }

          if (existing?.memberId === member.id) {
            result.alreadyLinked += 1;
            continue;
          }

          users[clean] = {
            ...(existing || {}),
            role: existing?.role || 'membro',
            memberId: member.id,
          };
          result.linked += 1;
          changed = true;
        }

        if (changed) await dbSet('users', users);
        setDirectory(users);
        return result;
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
        const credential = await mod.signInWithEmailLink(auth, clean, window.location.href);
        window.localStorage.removeItem(INVITE_EMAIL_KEY);
        return credential.user;
      },

      async saveRegistration(profile) {
        const { auth } = await getFirebaseAuth();
        const current = auth.currentUser;
        if (!current?.uid || !current.email) throw new Error('Sessão expirada. Abra novamente o link do convite.');
        const { db, mod } = await getFirebaseFirestore();
        const now = new Date().toISOString();
        await mod.setDoc(
          mod.doc(db, 'memberRegistrations', current.uid),
          {
            name: profile.name.trim(),
            birthdate: profile.birthdate,
            phone: profile.phone.trim(),
            email: current.email.toLowerCase(),
            status: 'pending',
            createdAt: profile.createdAt || now,
            updatedAt: now,
          },
          { merge: true }
        );
      },

      async listRegistrations() {
        if (role !== 'admin') return [];
        const { db, mod } = await getFirebaseFirestore();
        const snap = await mod.getDocs(mod.collection(db, 'memberRegistrations'));
        return snap.docs
          .map((docSnap) => ({ uid: docSnap.id, ...docSnap.data() }))
          .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      },

      async acceptRegistration(registration, memberId, membersSnapshot) {
        if (role !== 'admin') throw new Error('Apenas administradores podem concluir cadastros.');
        const clean = registration.email.trim().toLowerCase();

        await dbSet('members', membersSnapshot);

        const users = (await dbGet('users')) || {};
        users[clean] = { ...(users[clean] || {}), role: 'membro', memberId };
        await dbSet('users', users);
        setDirectory(users);

        const { db, mod } = await getFirebaseFirestore();
        await mod.updateDoc(mod.doc(db, 'memberRegistrations', registration.uid), {
          status: 'accepted',
          memberId,
          acceptedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      },

      async definePassword(password) {
        const { auth, mod } = await getFirebaseAuth();
        if (!auth.currentUser) throw new Error('Sessão expirada.');
        await mod.updatePassword(auth.currentUser, password);
      },

      async resetPassword(mail) {
        const { auth, mod } = await getFirebaseAuth();
        auth.languageCode = 'pt-BR';
        const cfg = await loadFirebaseConfig();
        const origin = (cfg.appUrl || window.location.origin).replace(/\/$/, '');
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
