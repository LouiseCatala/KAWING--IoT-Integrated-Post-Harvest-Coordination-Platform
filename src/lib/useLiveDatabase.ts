import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import type { UserAccount } from '../types';
import { COLLECTIONS, changesBetween, rebaseSnapshot, type DatabaseSnapshot, type Collection } from './databaseSync';
import { startLiveUpdates, subscribeLiveUpdates } from './liveUpdates';
import { newRecordId } from './submissionGuard';

interface Options {
  user: UserAccount | null;
  loaded: boolean;
  state: DatabaseSnapshot;
  apply: (state: DatabaseSnapshot) => void;
  normalize: (state: DatabaseSnapshot) => DatabaseSnapshot;
  onUnauthorized: () => void;
  onError: (message: string) => void;
  retry: number;
  targetedSave: MutableRefObject<boolean>;
}

export function useLiveDatabase(options: Options) {
  const latest = useRef(options);
  latest.current = options;
  const wake = useRef<() => void>(() => {});

  useEffect(() => {
    if (!options.loaded || !options.user?.email) return;
    const admin = options.user.role === 'admin';
    let baseline = latest.current.state;
    let ready = false;
    let stopped = false;
    let busy = false;
    let paused = false;
    let pendingBatch: { id: string; changes: ReturnType<typeof changesBetween>; sent: DatabaseSnapshot } | null = null;
    let retry = latest.current.retry;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const pending = new Set<Collection>(COLLECTIONS);
    const controllers = new Set<AbortController>();

    const request = async (url: string, init?: RequestInit) => {
      const controller = new AbortController();
      controllers.add(controller);
      const timeout = setTimeout(() => controller.abort(), 20000);
      try {
        const response = await fetch(url, { credentials: 'include', cache: 'no-store', ...init, signal: controller.signal });
        const data = await response.json().catch(() => ({}));
        if (response.status === 401 || (response.status === 403 && url.startsWith('/api/realtime/snapshot'))) {
          if (!stopped) latest.current.onUnauthorized();
          throw new Error('Session expired');
        }
        if (!response.ok) throw Object.assign(new Error(data.error || 'Updates could not be saved. Retrying when the connection recovers.'), { status: response.status });
        return data;
      } finally { clearTimeout(timeout); controllers.delete(controller); }
    };
    const apply = (next: DatabaseSnapshot) => {
      if (stopped) return;
      // Update this ref synchronously so a queued response cannot use an old render.
      latest.current = { ...latest.current, state: next };
      latest.current.apply(next);
    };
    const schedule = (delay = 300) => {
      if (stopped) return;
      clearTimeout(timer);
      timer = setTimeout(run, delay);
    };
    const refresh = async () => {
      const topics = [...pending];
      pending.clear();
      try {
        const data = await request(`/api/realtime/snapshot?collections=${topics.join(',')}`);
        if (stopped) return;
        const remote = latest.current.normalize({ ...baseline, ...data });
        const next = rebaseSnapshot(baseline, latest.current.state, remote, admin);
        baseline = remote;
        ready = true;
        apply(next);
      } catch (error) { topics.forEach(topic => pending.add(topic)); throw error; }
    };
    async function run() {
      if (stopped || busy) return;
      busy = true;
      let delay = 300;
      try {
        if (!ready) await refresh();
        if (stopped) return;
        if (latest.current.targetedSave.current) {
          // Profile/provider preferences use dedicated endpoints. Never suppress
          // simultaneous edits to offers, notifications or other collections.
          latest.current.targetedSave.current = false;
          baseline = { ...baseline, users: latest.current.state.users };
          pending.add('users');
        }
        if (latest.current.retry !== retry) {
          retry = latest.current.retry;
          paused = false;
          COLLECTIONS.forEach(topic => pending.add(topic));
          await refresh();
        }
        const sent = latest.current.state;
        const changes = changesBetween(baseline, sent, admin);
        if (changes.length && !paused && !pendingBatch) pendingBatch = { id: newRecordId('write'), changes, sent };
        if (pendingBatch && !paused) {
          const batch = pendingBatch;
          const result = await request('/api/realtime/changes', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ changes: batch.changes, requestId: batch.id }),
          });
          if (stopped) return;
          const remote = latest.current.normalize({ ...baseline, ...result.data });
          const next = rebaseSnapshot(batch.sent, latest.current.state, remote, admin);
          pendingBatch = null;
          baseline = remote;
          latest.current.onError('');
          apply(next);
        }
        if (pending.size && !stopped) await refresh();
      } catch (error) {
        if (stopped) return;
        const status = (error as { status?: number }).status;
        if (status === 409 || status === 403 || status === 422) {
          pendingBatch = null;
          paused = true;
          latest.current.onError(error instanceof Error ? error.message : 'Please review your changes before retrying.');
          COLLECTIONS.forEach(topic => pending.add(topic));
        }
        delay = 10000;
      } finally {
        busy = false;
        if (!stopped && (pending.size || (!paused && (pendingBatch || changesBetween(baseline, latest.current.state, admin).length)))) schedule(delay);
      }
    }
    wake.current = () => schedule();
    const unsubscribe = subscribeLiveUpdates(topics => {
      for (const topic of topics) if ((COLLECTIONS as readonly string[]).includes(topic)) pending.add(topic as Collection);
      if (topics.includes('harvests')) pending.add('offers');
      if (pending.size) schedule(50);
    });
    const stopTransport = startLiveUpdates(() => latest.current.onUnauthorized());
    schedule(0);
    return () => {
      stopped = true;
      wake.current = () => {};
      clearTimeout(timer);
      controllers.forEach(controller => controller.abort());
      unsubscribe();
      stopTransport();
    };
  }, [options.loaded, options.user?.email, options.user?.role]);

  useEffect(() => { wake.current(); }, [options.state, options.retry]);
}
