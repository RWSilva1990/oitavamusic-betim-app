import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { dbGet, dbSet } from './db';
import { useAuth } from './auth';
import { getMemberAppData } from './member-data.functions';
import { getMobileMemberData, isPackagedNativeApp } from './mobile-api.client';
import { sendScaleAddedNotifications } from './push-client';

const DataCtx = createContext(null);

export function DataProvider({ children }) {
  const auth = useAuth();
  const [members, setMembersState] = useState([]);
  const [groups, setGroupsState] = useState([]);
  const [songs, setSongsState] = useState([]);
  const [scales, setScalesState] = useState([]);
  const [ready, setReady] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncOk, setSyncOk] = useState(null);
  const readyRef = useRef(false);
  const scalesRef = useRef([]);

  const clearAll = useCallback(() => {
    setMembersState([]);
    setGroupsState([]);
    setSongsState([]);
    scalesRef.current = [];
    setScalesState([]);
  }, []);

  const loadAll = useCallback(async () => {
    if (!auth.user || !auth.role) return;

    if (auth.role === 'membro') {
      const idToken = await auth.user.getIdToken(true);
      const memberData = isPackagedNativeApp()
        ? await getMobileMemberData(idToken)
        : await getMemberAppData({ data: { idToken } });
      setMembersState(memberData?.member ? [memberData.member] : []);
      setGroupsState(memberData?.groups || []);
      setSongsState(memberData?.songs || []);
      const nextScales = memberData?.scales || [];
      scalesRef.current = nextScales;
      setScalesState(nextScales);
      return;
    }

    const [m, g, s, sc] = await Promise.all([
      dbGet('members'),
      dbGet('groups'),
      dbGet('songs'),
      dbGet('scales'),
    ]);
    if (m) {
      const cleaned = m.map((mb) => ({ ...mb, roles: (mb.roles || []).filter((r) => r !== 'vocal') }));
      setMembersState(cleaned);
      if (auth.isAdmin && m.some((mb) => (mb.roles || []).includes('vocal'))) {
        await dbSet('members', cleaned);
      }
    } else {
      setMembersState([]);
    }
    setGroupsState(g || []);
    setSongsState(s || []);
    const nextScales = sc || [];
    scalesRef.current = nextScales;
    setScalesState(nextScales);
  }, [auth.user, auth.role, auth.isAdmin]);

  useEffect(() => {
    if (auth.loading) {
      setReady(false);
      readyRef.current = false;
      return;
    }

    if (!auth.configured || !auth.user || !auth.role) {
      clearAll();
      readyRef.current = false;
      setReady(true);
      setSyncing(false);
      setSyncOk(null);
      return;
    }

    let alive = true;
    setReady(false);
    readyRef.current = false;
    setSyncing(true);
    loadAll()
      .then(() => { if (alive) setSyncOk(true); })
      .catch((error) => {
        console.error('Falha ao carregar dados do Firestore', error);
        if (alive) setSyncOk(false);
      })
      .finally(() => {
        if (!alive) return;
        readyRef.current = true;
        setReady(true);
        setSyncing(false);
      });

    return () => { alive = false; };
  }, [auth.loading, auth.configured, auth.user?.uid, auth.role, clearAll, loadAll]);

  useEffect(() => {
    if (!auth.user || !auth.role) return undefined;
    const onFocus = () => { if (readyRef.current) loadAll().catch(console.error); };
    window.addEventListener('focus', onFocus);
    const interval = setInterval(() => {
      if (document.hasFocus() && readyRef.current) loadAll().catch(console.error);
    }, 30000);
    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, [auth.user?.uid, auth.role, loadAll]);

  const persist = useCallback(async (key, val, throwOnError = false) => {
    if (!auth.user || !auth.isAdmin) {
      if (throwOnError) throw new Error('Apenas administradores podem alterar os dados do ministério.');
      return;
    }
    setSyncing(true);
    setSyncOk(null);
    try {
      await dbSet(key, val);
      setSyncOk(true);
    } catch (error) {
      console.error(`Falha ao salvar oitava/${key}`, error);
      setSyncOk(false);
      if (throwOnError) throw error;
    } finally {
      setSyncing(false);
    }
  }, [auth.user, auth.isAdmin]);

  const makeSetter = (key, setState) => (updater) =>
    setState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (readyRef.current && auth.isAdmin) persist(key, next);
      return next;
    });

  const setScales = useCallback((updater) => {
    const prev = scalesRef.current;
    const next = typeof updater === 'function' ? updater(prev) : updater;

    scalesRef.current = next;
    setScalesState(next);

    if (!readyRef.current || !auth.isAdmin) return next;

    const notifications = [];
    for (const scale of next || []) {
      const previous = (prev || []).find((item) => item.id === scale.id);
      const previousMemberIds = new Set((previous?.scaleMembers || []).map((item) => item.memberId));
      const addedMemberIds = (scale.scaleMembers || [])
        .map((item) => item.memberId)
        .filter((memberId) => memberId && !previousMemberIds.has(memberId));

      if (addedMemberIds.length > 0) notifications.push({ scale, addedMemberIds });
    }

    persist('scales', next, true)
      .then(async () => {
        for (const item of notifications) {
          try {
            await sendScaleAddedNotifications(item.scale, item.addedMemberIds);
          } catch (error) {
            console.warn('A escala foi salva, mas a notificação não pôde ser enviada:', error);
          }
        }
      })
      .catch((error) => console.error('A escala não foi salva; notificações não foram enviadas.', error));

    return next;
  }, [auth.isAdmin, persist]);

  const saveScales = useCallback(async (next) => {
    if (!readyRef.current) throw new Error('Os dados ainda estão sendo carregados.');
    await persist('scales', next, true);
    scalesRef.current = next;
    setScalesState(next);
    return next;
  }, [persist]);

  const value = {
    members,
    groups,
    songs,
    scales,
    ready,
    syncing,
    syncOk,
    reload: loadAll,
    setMembers: makeSetter('members', setMembersState),
    setGroups: makeSetter('groups', setGroupsState),
    setSongs: makeSetter('songs', setSongsState),
    setScales,
    saveScales,
  };

  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
}

export function useData() {
  const ctx = useContext(DataCtx);
  if (!ctx) throw new Error('useData precisa estar dentro de DataProvider');
  return ctx;
}
