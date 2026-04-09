export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-canvas text-text-primary">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Get started by editing&nbsp;
          <code className="font-mono font-bold text-brand-primary">app/page.tsx</code>
        </p>
      </div>

      <div className="relative flex flex-col items-center gap-8 mt-12">
        <h1 className="text-6xl font-sans font-bold tracking-tight text-brand-secondary">
          sopnow
        </h1>
        <p className="text-xl text-text-muted max-w-lg text-center font-sans">
          Automate high-quality, structured SOP documentation with AI and bi-directional ClickUp sync.
        </p>
        
        <div className="flex gap-4">
          <button className="bg-brand-primary text-white px-6 py-3 rounded-lg font-sans font-semibold hover:opacity-90 transition-opacity">
            Start New SOP
          </button>
          <button className="bg-surface border border-brand-secondary text-brand-secondary px-6 py-3 rounded-lg font-sans font-semibold hover:bg-brand-secondary/5 transition-colors">
            View Dashboard
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 w-full max-w-6xl">
        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 className="text-status-success font-bold mb-2 font-sans">SOP Breakdown</h3>
          <p className="text-text-muted font-sans text-sm">AI-driven stage identification and structure optimization.</p>
        </div>
        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 className="text-brand-primary font-bold mb-2 font-sans">Scribe Integration</h3>
          <p className="text-text-muted font-sans text-sm">Upload visual guides and refine them with contextual AI refinement.</p>
        </div>
        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 className="text-status-premium font-bold mb-2 font-sans">ClickUp Sync</h3>
          <p className="text-text-muted font-sans text-sm">Push structured SOPs directly to your ClickUp workspace hierarchy.</p>
        </div>
      </div>
    </main>
  );
}
