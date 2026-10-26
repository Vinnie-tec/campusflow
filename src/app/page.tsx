import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-dvh overflow-hidden bg-canvas text-ink">
      <div className="mx-auto flex min-h-dvh max-w-7xl flex-col px-6 sm:px-10">
        <header className="flex items-center justify-between py-6">
          <Link href="/" className="inline-flex items-center gap-3" aria-label="CampusFlow home">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-ink text-sm font-bold text-white shadow-lg shadow-slate-900/10">
              C
            </span>
            <span className="text-lg font-bold tracking-tight">campusflow</span>
          </Link>
          <nav aria-label="Main navigation" className="flex items-center gap-2">
            <Link
              href="/courses"
              className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-ink"
            >
              Courses
            </Link>
            <Link
              href="/projects"
              className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-ink"
            >
              Projects
            </Link>
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-ink"
            >
              Sign in
            </Link>
          </nav>
        </header>

        <section className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:py-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-brand shadow-sm">
              <span className="size-2 rounded-full bg-indigo-500" />
              YOUR IDEAS, IN MOTION
            </span>
            <h1 className="mt-7 text-5xl leading-[1.08] font-semibold tracking-tight text-ink sm:text-6xl lg:text-7xl">
              Make room for
              <span className="block text-brand">great work.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Find courses to grow your skills and keep your campus projects moving, all in one
              place.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Explore courses
                <span aria-hidden="true">-&gt;</span>
              </Link>
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-ink transition hover:border-indigo-200 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Manage projects
                <span aria-hidden="true">-&gt;</span>
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-5 rounded-[2.5rem] bg-linear-to-br from-indigo-100 via-sky-50 to-amber-50 blur-2xl" />
            <div className="relative rounded-4xl border border-white bg-white/90 p-5 shadow-2xl shadow-indigo-950/10 sm:p-7">
              <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                <div>
                  <p className="text-xs font-semibold tracking-[0.16em] text-slate-400 uppercase">
                    A little more focus
                  </p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight">From idea to done</h2>
                </div>
                <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-lg text-brand" aria-hidden="true">
                  +
                </span>
              </div>
              <div className="space-y-3 pt-5">
                <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-sm font-bold text-violet-700">01</span>
                  <div>
                    <p className="font-semibold">Capture the idea</p>
                    <p className="mt-0.5 text-sm text-slate-500">Give your project a name and a why.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sm font-bold text-sky-700">02</span>
                  <div>
                    <p className="font-semibold">Find your next step</p>
                    <p className="mt-0.5 text-sm text-slate-500">Keep the important details close.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-sm font-bold text-amber-700">03</span>
                  <div>
                    <p className="font-semibold">Build momentum</p>
                    <p className="mt-0.5 text-sm text-slate-500">Make progress, one step at a time.</p>
                  </div>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 text-sm text-indigo-900">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white font-bold text-brand" aria-hidden="true">C</span>
                <p><span className="font-semibold">Your workspace starts here.</span> Make it yours.</p>
              </div>
            </div>
          </div>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 py-5 text-xs text-slate-500">
          <p>CampusFlow</p>
          <p>One good idea can go a long way.</p>
        </footer>
      </div>
    </main>
  );
}
