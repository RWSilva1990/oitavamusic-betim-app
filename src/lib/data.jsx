import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { dbGet, dbSet } from './db';
import { useAuth } from './auth';
import { getMemberAppData } from './member-data.functions';
import {
  getMobileAdminData,
  getMobileMemberData,
  isDirectFirebaseTestMode,
  isPackagedNativeApp,
  saveMobileAdminData,
} from './mobile-api';
import { sendScaleEventNotification } from './notification-center';

const DataCtx = createContext(null);

function normalizedRoles(entry) {
  return [...new Set((entry?.roles || (entry?.role ? [entry.role] : [])).filter(Boolean))].sort();
}

function sameStringArray(a, b) {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

function sameIdSet(a, b) {
  if (a.size !== b.size) return false;
  for (const value of a) if (!b.has(value)) return false;
  return true;
}

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
      if (isDirectFirebaseTestMode()) {
        throw new Error('Acesso de membro ainda não está habilitado no laboratório isolado.');
      }
      const idToken = await auth.user.getIdToken(true);
      const memberData = isPackagedNativeApp()
        ? await getMobileMemberData(idToken)
        : await getMemberAppData({ data: { idToken } });
      const visibleMembers = Array.isArray(memberData?.members) && memberData.members.length > 0
        ? memberData.members
        : memberData?.member
          ? [memberData.member]
          : [];
      setMembersState(visibleMembers);
      setGroupsState(memberData?.groups || []);
      setSongsState(memberData?.songs || []);
      const nextScales = memberData?.scales || [];
      scalesRef.current = nextScales;
      setScalesState(nextScales);
      return;
    }

    if (isPackagedNativeApp() && !isDirectFirebaseTestMode()) {
      const idToken = await auth.user.getIdToken(true);
      const adminData = await getMobileAdminData(idToken);
      const m = adminData?.members || [];
      const cleaned = m.map((mb) => ({ ...mb, roles: (mb.roles || []).filter((r) => r !== 'vocal') }));
      setMembersState(cleaned);
      if (auth.isAdmin && m.some((mb) => (mb.roles || []).includes('vocal'))) {
        await saveMobileAdminData(idToken, 'members', cleaned);
      }
      setGroupsState(adminData?.groups || []);
      setSongsState(adminData?.songs || []);
      const nextScales = adminData?.scales || [];
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
      if (isPackagedNativeApp() && !isDirectFirebaseTestMode()) {
        const idToken = await auth.user.getIdToken(true);
        await saveMobileAdminData(idToken, key, val);
      } else {
        await dbSet(key, val);
      }
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
      const previousMembers = previous?.scaleMembers || [];
      const nextMembers = scale.scaleMembers || [];
      const previousMemberIds = new Set(previousMembers.map((item) => item.memberId).filter(Boolean));
      const nextMemberIds = new Set(nextMembers.map((item) => item.memberId).filter(Boolean));

      const addedMemberIds = [...nextMemberIds].filter((memberId) => !previousMemberIds.has(memberId));
      const removedMemberIds = previous
        ? [...previousMemberIds].filter((memberId) => !nextMemberIds.has(memberId))
        : [];

      if (addedMemberIds.length > 0) {
        notifications.push({ type: 'scale-added', scale, memberIds: addedMemberIds });
      }
      if (removedMemberIds.length > 0) {
        notifications.push({ type: 'scale-removed', scale, memberIds: removedMemberIds });
      }

      if (!previous) continue;

      const existingMemberIds = [...nextMemberIds].filter(
        (memberId) => previousMemberIds.has(memberId) && !addedMemberIds.includes(memberId),
      );

      for (const memberId of existingMemberIds) {
        const before = previousMembers.find((item) => item.memberId === memberId);
        const after = nextMembers.find((item) => item.memberId === memberId);
        if (!sameStringArray(normalizedRoles(before), normalizedRoles(after))) {
          notifications.push({ type: 'role-changed', scale, memberIds: [memberId] });
        }
      }

      const previousSongs = previous.scaleSongs || [];
      const nextSongs = scale.scaleSongs || [];
      const previousSongIds = new Set(previousSongs.map((item) => item.songId).filter(Boolean));
      const nextSongIds = new Set(nextSongs.map((item) => item.songId).filter(Boolean));

      if (!sameIdSet(previousSongIds, nextSongIds) && existingMemberIds.length > 0) {
        notifications.push({ type: 'repertoire-changed', scale, memberIds: existingMemberIds });
      }

      const changedSongIds = [];
      for (const nextSong of nextSongs) {
        if (!previousSongIds.has(nextSong.songId)) continue;
        const previousSong = previousSongs.find((item) => item.songId === nextSong.songId);
        const keyChanged = String(previousSong?.key || '').trim() !== String(nextSong?.key || '').trim();
        const soloChanged = String(previousSong?.soloMemberId || '') !== String(nextSong?.soloMemberId || '');
        if (keyChanged || soloChanged) changedSongIds.push(nextSong.songId);
      }

      if (changedSongIds.length > 0 && existingMemberIds.length > 0) {
        const detail = changedSongIds.length === 1
          ? { songName: songs.find((song) => song.id === changedSongIds[0])?.name || '' }
          : undefined;
        notifications.push({
          type: 'song-details-changed',
          scale,
          memberIds: existingMemberIds,
          ...(detail?.songName ? { detail } : {}),
        });
      }
    }

    for (const previous of prev || []) {
      if ((next || []).some((scale) => scale.id === previous.id)) continue;
      const memberIds = [...new Set((previous.scaleMembers || []).map((item) => item.memberId).filter(Boolean))];
      if (memberIds.length > 0) {
        notifications.push({ type: 'scale-removed', scale: previous, memberIds });
      }
    }

    persist('scales', next, true)
      .then(async () => {
        if (isDirectFirebaseTestMode()) return;
        for (const item of notifications) {
          try {
            await sendScaleEventNotification(item.type, item.scale, item.memberIds, item.detail);
          } catch (error) {
            console.warn('A escala foi salva, mas um aviso não pôde ser enviado:', error);
          }
        }
      })
      .catch((error) => console.error('A escala não foi salva; avisos não foram enviados.', error));

    return next;
  }, [auth.isAdmin, persist, songs]);

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
