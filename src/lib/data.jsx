import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { dbGet, dbSet } from './db';
import { useAuth } from './auth';

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

  const clearAll = useCallback(() => {
    setMembersState([]);
    setGroupsState([]);
    setSongsState([]);
    setScalesState([]);
  }, []);

  const loadAll = useCallback(async () => {
    if (!auth.user) return;
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
    setScalesState(sc || []);
  }, [auth.user, auth.isAdmin]);

  // Do not touch Firestore until Firebase Authentication has resolved the
  // current session. This prevents the initial permission-denied race that can
  // otherwise make the application look empty immediately after login.
  useEffect(() => {
    if (auth.loading) {
      setReady(false);
      readyRef.current = false;
      return;
    }

    if (!auth.configured || !auth.user) {
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
  }, [auth.loading, auth.configured, auth.user?.uid, clearAll, loadAll]);

  useEffect(() => {
    if (!auth.user) return undefined;
    const onFocus = () => { if (readyRef.current) loadAll().catch(console.error); };
    window.addEventListener('focus', onFocus);
    const interval = setInterval(() => {
      if (document.hasFocus() && readyRef.current) loadAll().catch(console.error);
    }, 30000);
    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, [auth.user?.uid, loadAll]);

  const persist = useCallback(async (key, val) => {
    if (!auth.user || !auth.isAdmin) return;
    setSyncing(true);
    setSyncOk(null);
    try {
      await dbSet(key, val);
      setSyncOk(true);
    } catch (error) {
      console.error(`Falha ao salvar oitava/${key}`, error);
      setSyncOk(false);
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
    setScales: makeSetter('scales', setScalesState),
  };

  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
}

export function useData() {
  const ctx = useContext(DataCtx);
  if (!ctx) throw new Error('useData precisa estar dentro de DataProvider');
  return ctx;
}
