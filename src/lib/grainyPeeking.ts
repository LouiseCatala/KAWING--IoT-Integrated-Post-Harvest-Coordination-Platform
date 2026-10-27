export const GRAINY_PEEK_INTERVAL = 25000;
export const GRAINY_IDLE_DELAY = 10000;
export const GRAINY_PEEK_DURATION = 8000;
export const GRAINY_PEEK_GREETING = "Hi, I'm Grainy! Do you need help?";

// Idle can bring the next peek forward, but an untouched tab does not repeatedly
// fire idle prompts. Website activity arms the next idle prompt again.
export function startGrainyPeeking(onPeek: () => void) {
  let stopped = false;
  let periodic: ReturnType<typeof setTimeout>;
  let idle: ReturnType<typeof setTimeout>;
  const activityEvents = ['click', 'pointermove', 'pointerdown', 'keydown', 'scroll', 'touchstart'] as const;
  const peek = () => {
    if (stopped || document.visibilityState === 'hidden') return;
    clearTimeout(periodic);
    clearTimeout(idle);
    onPeek();
    // The bubble is visible for PEEK_DURATION; the regular waiting period
    // starts after it hides. Idle activity may still bring the next peek forward.
    periodic = setTimeout(peek, GRAINY_PEEK_DURATION + GRAINY_PEEK_INTERVAL);
  };
  const activity = () => {
    if (stopped || document.visibilityState === 'hidden') return;
    clearTimeout(idle);
    idle = setTimeout(peek, GRAINY_IDLE_DELAY);
  };
  const visibility = () => {
    clearTimeout(periodic);
    clearTimeout(idle);
    if (document.visibilityState !== 'hidden') {
      periodic = setTimeout(peek, GRAINY_PEEK_INTERVAL);
      activity();
    }
  };
  for (const event of activityEvents) window.addEventListener(event, activity, { passive: true, capture: true });
  document.addEventListener('visibilitychange', visibility);
  visibility();
  return () => {
    stopped = true;
    clearTimeout(periodic);
    clearTimeout(idle);
    for (const event of activityEvents) window.removeEventListener(event, activity, true);
    document.removeEventListener('visibilitychange', visibility);
  };
}
