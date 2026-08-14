import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getFirebaseAuth, getFirebaseFirestore, loadFirebaseConfig } from './firebase';
import { dbGet, dbSet } from './db';

const AuthCtx = createContext(null);

const INVITE_EMAIL_KEY = 'oitava:invite-email';
const ACCESS_EMAIL_KEY = 'oitava:access-email';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessLoading, setAccessLoading] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [adminEmails, setAdminEmails] = useState([]);
  const [accessEntry, setAccessEntry] = useState(null);

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
        setAccessLoading(Boolean(u));
        setLoading(false);
      });
    })().catch(() => setLoading(false));
    return () => { alive = false; unsub(); };
  }, []);

  useEffect(() => {
    let alive = true;
    const resolveAccess = async () => {
      const clean = user?.email?.trim().toLowerCase();
      if (!clean) {
        setAccessEntry(null);
        setAccessLoading(false);
        return;
      }

      if (adminEmails.includes(clean)) {
        setAccessEntry({ role: 'admin', email: clean });
        setAccessLoading(false);
        return;
      }

      setAccessLoading(true);
      try {
        const { db, mod } = await getFirebaseFirestore();
        const snap = await mod.getDoc(mod.doc(db, 'accessUsers', clean));
        if (alive) setAccessEntry(snap.exists() ? snap.data() : null);
      } catch {
        if (alive) setAccessEntry(null);
      } finally {
        if (alive) setAccessLoading(false);
      }
    };

    resolveAccess();
    return () => { alive = false; };
  }, [user?.uid, user?.email, adminEmails]);

  const email = user?.email?.toLowerCase() || null;
  const role = !user
    ? null
    : adminEmails.includes(email) || accessEntry?.role === 'admin'
      ? 'admin'
      : accessEntry?.role === 'membro' && accessEntry?.memberId
        ? 'membro'
        : null;

  const api = useMemo(
    () => ({
      user,
      email,
      role,
      loading: loading || accessLoading,
      configured,
      isAdmin: role === 'admin',

      async signIn(mail, password) {
        const clean = mail.trim().toLowerCase();
        const { auth, mod } = await getFirebaseAuth();
        const credential = await mod.signInWithEmailAndPassword(auth, clean, password);
        const signedEmail = credential.user?.email?.trim().toLowerCase();

        if (!signedEmail) {
          await mod.signOut(auth);
          throw new Error('Não foi possível identificar o e-mail desta conta.');
        }

        if (adminEmails.includes(signedEmail)) {
          setAccessEntry({ role: 'admin', email: signedEmail });
          return credential.user;
        }

        try {
          const { db, mod: fireMod } = await getFirebaseFirestore();
          const snap = await fireMod.getDoc(fireMod.doc(db, 'accessUsers', signedEmail));
          const entry = snap.exists() ? snap.data() : null;
          if (entry?.role !== 'membro' || !entry?.memberId) {
            await mod.signOut(auth);
            setAccessEntry(null);
            throw new Error('Este e-mail não está liberado para acessar o aplicativo.');
          }
          setAccessEntry(entry);
          return credential.user;
        } catch (error) {
          if (auth.currentUser) await mod.signOut(auth);
          setAccessEntry(null);
          if (error?.message?.includes('não está liberado')) throw error;
          throw new Error('Não foi possível validar a liberação deste acesso.');
        }
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

        // Mantemos o diretório legado por compatibilidade com os dados atuais.
        // O convidado só ganha um documento em /accessUsers depois da aprovação.
        const users = (await dbGet('users')) || {};
        if (!users[clean]) users[clean] = { role: 'membro' };
        await dbSet('users', users);
      },

      async sendAccessLink(mail) {
        const clean = mail.trim().toLowerCase();
        const { auth, mod } = await getFirebaseAuth();
        auth.languageCode = 'pt-BR';
        const cfg = await loadFirebaseConfig();
        const origin = (cfg.appUrl || window.location.origin).replace(/\/$/, '');
        const continueUrl = `${origin}/acesso`;
        try {
          await mod.sendSignInLinkToEmail(auth, clean, {
            url: continueUrl,
            handleCodeInApp: true,
          });
          window.localStorage.setItem(ACCESS_EMAIL_KEY, clean);
        } catch (error) {
          if (error?.code === 'auth/unauthorized-continue-uri') {
            throw new Error(`Firebase recusou o domínio de retorno. URL usada: ${continueUrl}`);
          }
          throw error;
        }
      },

      async completeAccess(mail) {
        const clean = mail.trim().toLowerCase();
        const { auth, mod } = await getFirebaseAuth();
        if (!mod.isSignInWithEmailLink(auth, window.location.href)) {
          throw new Error('Link inválido ou expirado. Solicite um novo link na tela de acesso.');
        }

        const credential = await mod.signInWithEmailLink(auth, clean, window.location.href);
        const signedEmail = credential.user?.email?.trim().toLowerCase();
        if (!signedEmail || signedEmail !== clean) {
          await mod.signOut(auth);
          throw new Error('O e-mail informado não corresponde ao link recebido.');
        }

        if (adminEmails.includes(clean)) {
          setAccessEntry({ role: 'admin', email: clean });
          window.localStorage.removeItem(ACCESS_EMAIL_KEY);
          return { user: credential.user, role: 'admin' };
        }

        try {
          const { db, mod: fireMod } = await getFirebaseFirestore();
          const snap = await fireMod.getDoc(fireMod.doc(db, 'accessUsers', clean));
          const entry = snap.exists() ? snap.data() : null;
          if (entry?.role !== 'membro' || !entry?.memberId) {
            await mod.signOut(auth);
            throw new Error('Este e-mail ainda não está vinculado a um membro liberado.');
          }
          setAccessEntry(entry);
          window.localStorage.removeItem(ACCESS_EMAIL_KEY);
          return { user: credential.user, role: 'membro' };
        } catch (error) {
          if (auth.currentUser) await mod.signOut(auth);
          if (error?.message?.includes('ainda não está vinculado')) throw error;
          throw new Error('Este e-mail não está liberado para acessar o aplicativo.');
        }
      },

      async syncMemberDirectory(members) {
        if (role !== 'admin') throw new Error('Apenas administradores podem sincronizar acessos.');

        const users = (await dbGet('users')) || {};
        const { db, mod } = await getFirebaseFirestore();
        const accessSnap = await mod.getDocs(mod.collection(db, 'accessUsers'));
        const accessUsers = Object.fromEntries(accessSnap.docs.map((d) => [d.id.toLowerCase(), d.data()]));

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

        let legacyChanged = false;
        const batch = mod.writeBatch(db);
        let batchWrites = 0;
        const now = new Date().toISOString();

        for (const member of members || []) {
          const clean = String(member?.email || '').trim().toLowerCase();
          if (!clean) { result.withoutEmail += 1; continue; }
          if (!emailRegex.test(clean)) { result.invalidEmail += 1; continue; }
          if (duplicateEmails.has(clean)) continue;

          const legacy = users[clean];
          const access = accessUsers[clean];
          const conflictingMemberId =
            (legacy?.memberId && legacy.memberId !== member.id)
            || (access?.memberId && access.memberId !== member.id);

          if (conflictingMemberId) {
            result.conflicts += 1;
            result.conflictEmails.push(clean);
            continue;
          }

          const targetRole = adminEmails.includes(clean) || legacy?.role === 'admin' || access?.role === 'admin'
            ? 'admin'
            : 'membro';

          const legacyCorrect = legacy?.memberId === member.id && legacy?.role === targetRole;
          const accessCorrect = access?.memberId === member.id && access?.role === targetRole;

          if (!legacyCorrect) {
            users[clean] = { ...(legacy || {}), role: targetRole, memberId: member.id };
            legacyChanged = true;
          }

          if (!accessCorrect) {
            batch.set(
              mod.doc(db, 'accessUsers', clean),
              { email: clean, role: targetRole, memberId: member.id, updatedAt: now },
              { merge: true }
            );
            batchWrites += 1;
          }

          if (legacyCorrect && accessCorrect) result.alreadyLinked += 1;
          else result.linked += 1;
        }

        if (legacyChanged) await dbSet('users', users);
        if (batchWrites > 0) await batch.commit();
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

        const { db, mod } = await getFirebaseFirestore();
        const now = new Date().toISOString();
        await mod.setDoc(
          mod.doc(db, 'accessUsers', clean),
          { email: clean, role: 'membro', memberId, updatedAt: now },
          { merge: true }
        );
        await mod.updateDoc(mod.doc(db, 'memberRegistrations', registration.uid), {
          status: 'accepted',
          memberId,
          acceptedAt: now,
          updatedAt: now,
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
        setAccessEntry(null);
      },

      memberFor(members) {
        if (!email || !accessEntry?.memberId) return null;
        return members.find((m) => m.id === accessEntry.memberId) || null;
      },
    }),
    [user, email, role, loading, accessLoading, configured, accessEntry, adminEmails]
  );

  return <AuthCtx.Provider value={api}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth precisa estar dentro de AuthProvider');
  return ctx;
}
