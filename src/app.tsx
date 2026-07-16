/** Renders the static application shell that remains usable before the 3D experience loads. */
export function App() {
  return (
    <main className="relative isolate grid min-h-dvh place-items-center overflow-hidden bg-canvas px-6 py-12 text-ink">
      <div aria-hidden="true" className="movement-grid absolute inset-0 -z-20" />
      <div aria-hidden="true" className="movement-glow absolute -z-10" />

      <section className="w-full max-w-5xl border-l border-line pl-5 sm:pl-8">
        <p className="mb-5 font-mono text-xs tracking-[0.24em] text-muted uppercase">A mechanical watch atlas</p>
        <h1 className="max-w-4xl font-display text-6xl leading-[0.86] font-semibold tracking-[-0.065em] sm:text-8xl lg:text-9xl">
          TickyTocky
        </h1>
        <p className="mt-7 max-w-xl text-lg leading-7 text-muted sm:text-xl">
          An interactive guide to mechanical watches.
        </p>
        <p className="mt-14 font-mono text-xs tracking-[0.16em] text-accent uppercase">
          The movement is being assembled.
        </p>
      </section>
    </main>
  )
}
