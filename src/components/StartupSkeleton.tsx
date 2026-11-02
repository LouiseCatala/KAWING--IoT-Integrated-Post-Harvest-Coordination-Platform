export default function StartupSkeleton() {
  const block = 'rounded-lg bg-slate-200/80 dark:bg-slate-800/80';

  return (
    <div role="status" aria-label="Loading KAWING" aria-busy="true" className="min-h-dvh bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <span className="sr-only">Loading KAWING. Please wait.</span>
      <header className="border-b border-slate-200/70 px-5 py-5 dark:border-slate-800/70 sm:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="font-display text-lg font-black tracking-[0.18em] text-emerald-600 dark:text-emerald-400">KAWING</span>
          <div aria-hidden="true" className="flex gap-3 motion-safe:animate-pulse">
            <div className={`${block} hidden h-3 w-20 sm:block`} />
            <div className={`${block} h-3 w-12`} />
          </div>
        </div>
      </header>
      <div aria-hidden="true" className="mx-auto max-w-6xl space-y-8 px-5 py-8 motion-safe:animate-pulse sm:px-10 sm:py-12">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="w-full max-w-sm space-y-3">
            <div className={`${block} h-7 w-3/4`} />
            <div className={`${block} h-3 w-full`} />
          </div>
          <div className={`${block} h-10 w-36`} />
        </div>
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-slate-800/70 dark:bg-slate-900/40">
          <div className="flex flex-1 gap-3">
            {[0, 1, 2].map(item => <div key={item} className={`${block} h-8 w-20 ${item === 2 ? 'hidden sm:block' : ''}`} />)}
          </div>
          <div className={`${block} hidden h-8 w-48 md:block`} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map(item => (
            <div key={item} className={`space-y-5 rounded-2xl border border-slate-200/70 bg-white p-5 dark:border-slate-800/70 dark:bg-slate-900/40 ${item > 2 ? 'hidden sm:block' : ''}`}>
              <div className="flex items-center gap-3">
                <div className={`${block} h-10 w-10 shrink-0 rounded-xl`} />
                <div className="flex-1 space-y-2">
                  <div className={`${block} h-3 w-3/4`} />
                  <div className={`${block} h-2 w-1/2`} />
                </div>
              </div>
              <div className="space-y-2.5">
                <div className={`${block} h-2 w-full`} />
                <div className={`${block} h-2 w-5/6`} />
                <div className={`${block} h-2 w-2/3`} />
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                <div className={`${block} h-3 w-16`} />
                <div className={`${block} h-3 w-20`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
