export function PausePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07080c] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(245,180,45,0.18),transparent_50%)]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col items-center px-6 py-10 text-center sm:py-16">
        <div className="mb-4 flex items-center gap-3">
          <img
            src="/images/hero/mascot002.png"
            alt="BabaWina lion"
            width={56}
            height={56}
            className="h-12 w-12 rounded-2xl object-cover ring-2 ring-amber-400/40 sm:h-14 sm:w-14"
          />
          <div className="text-left">
            <p className="text-2xl font-black tracking-tight text-amber-300">BabaWina</p>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-100/60">
              Play smart · Win big
            </p>
          </div>
        </div>

        <img
          src="/images/hero/mascot01.png"
          alt="The BabaWina lion holding a golden ball"
          className="mb-6 h-auto w-[300px] max-w-[78vw] sm:w-[400px]"
        />

        <p className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-amber-300/80">
          A short pause
        </p>
        <h1 className="mb-6 text-4xl font-black leading-tight text-white sm:text-5xl">
          We’re taking a little break
        </h1>

        <div className="space-y-4 text-base leading-relaxed text-zinc-200 sm:text-lg">
          <p>
            Thank you for every guess, every cheer, and every “just one more entry.”
            BabaWina is stepping away for a while so we can rest and get the next
            chapter right.
          </p>
          <p className="text-xl font-extrabold text-amber-300 sm:text-2xl">
            We’ll be back with updates soon.
          </p>
          <p>
            Keep an eye on this page. When we return, the lion will be ready —
            and so will the prizes.
          </p>
        </div>

        <p className="mt-10 text-sm font-semibold text-zinc-400">
          See you on the pitch again.
          <br />
          <span className="text-amber-200">— The BabaWina team</span>
        </p>
      </div>
    </main>
  )
}