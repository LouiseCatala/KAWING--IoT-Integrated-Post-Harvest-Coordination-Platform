// One transport per app tab. Components subscribe to topics, never open sockets.
export const LIVE_TOPICS = ['users', 'harvests', 'services', 'offers', 'offeredServices', 'productionLoans', 'notifications', 'settings', 'announcements', 'faqs', 'moisture'] as const;
export type LiveTopic = typeof LIVE_TOPICS[number];
type Listener = (topics: LiveTopic[]) => void;
const listeners = new Set<Listener>();
export function subscribeLiveUpdates(listener: Listener) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function notifyLiveUpdates(topics: LiveTopic[]) {
  for (const listener of listeners) listener(topics);
}

export function startLiveUpdates(onUnauthorized: () => void) {
  let stopped = false;
  let source: EventSource | undefined;
  let versions: Record<string, string> = {};
  let pollTimer: ReturnType<typeof setTimeout> | undefined;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  let watchdog: ReturnType<typeof setTimeout> | undefined;
  let controller: AbortController | undefined;
  let reconnectDelay = 1000;
  let streaming = false;
  const accept = (next: Record<string, string>) => {
    const changed = LIVE_TOPICS.filter(topic => next[topic] !== versions[topic]);
    versions = next;
    if (changed.length) notifyLiveUpdates(changed);
  };
  const unauthorized = () => { stop(); onUnauthorized(); };
  const poll = async () => {
    if (stopped || controller || streaming) return;
    controller = new AbortController();
    const timeout = setTimeout(() => controller?.abort(), 8000);
    try {
      const response = await fetch('/api/realtime/status', { credentials: 'include', cache: 'no-store', signal: controller.signal });
      if (stopped) return;
      if (response.status === 401 || response.status === 403) { unauthorized(); return; }
      if (!response.ok) throw new Error('Live updates unavailable');
      const result = await response.json();
      if (stopped) return;
      accept(result.versions);
      if (result.sse && !source && !reconnectTimer && typeof EventSource !== 'undefined') connect();
    } catch { /* Keep the last good state during an outage. */ }
    finally {
      clearTimeout(timeout);
      controller = undefined;
      if (!stopped && !streaming) {
        clearTimeout(pollTimer);
        pollTimer = setTimeout(poll, 10000);
      }
    }
  };
  const heartbeat = () => {
    clearTimeout(watchdog);
    watchdog = setTimeout(disconnect, 20000);
  };
  const disconnect = () => {
    if (stopped) return;
    source?.close();
    source = undefined;
    streaming = false;
    clearTimeout(watchdog);
    clearTimeout(pollTimer);
    pollTimer = setTimeout(poll, 0);
    if (!reconnectTimer) {
      reconnectTimer = setTimeout(() => { reconnectTimer = undefined; connect(); }, reconnectDelay + Math.random() * 500);
      reconnectDelay = Math.min(reconnectDelay * 2, 30000);
    }
  };
  const connect = () => {
    if (stopped || source || navigator.onLine === false) return;
    source = new EventSource('/api/realtime/events', { withCredentials: true });
    heartbeat();
    // Wait for an actual frame: a buffered proxy's HTTP 200 is not a live stream.
    source.addEventListener('versions', event => {
      if (stopped) return;
      try {
        accept(JSON.parse((event as MessageEvent).data));
        streaming = true;
        reconnectDelay = 1000;
        clearTimeout(pollTimer);
        heartbeat();
      } catch { disconnect(); }
    });
    source.addEventListener('heartbeat', () => { if (!stopped) heartbeat(); });
    source.addEventListener('expired', unauthorized);
    source.addEventListener('renew', () => {
      if (stopped) return;
      source?.close(); source = undefined; streaming = false;
      clearTimeout(watchdog);
      reconnectTimer = setTimeout(() => { reconnectTimer = undefined; connect(); }, 250);
    });
    source.onerror = disconnect;
  };
  const resume = () => {
    if (document.visibilityState !== 'hidden') {
      notifyLiveUpdates([...LIVE_TOPICS]);
      if (!streaming) { clearTimeout(pollTimer); void poll(); }
    }
  };
  function stop() {
    stopped = true;
    source?.close();
    controller?.abort();
    clearTimeout(pollTimer);
    clearTimeout(reconnectTimer);
    clearTimeout(watchdog);
    window.removeEventListener('online', resume);
    document.removeEventListener('visibilitychange', resume);
  }
  window.addEventListener('online', resume);
  document.addEventListener('visibilitychange', resume);
  void poll();
  return stop;
}
