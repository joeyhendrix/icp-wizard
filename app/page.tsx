export default function Home() {
  return (
    <main className="min-h-screen bg-[#f2eed9] text-[#552222] flex items-center">
      <div className="mx-auto max-w-3xl p-8">
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
          Define your Ideal Customer Profile in minutes
        </h1>
        <p className="mt-4 text-lg md:text-xl">
          A guided interview that turns your answers into a client-ready ICP summary, JSON, and CSVs
          you can use in Apollo, Clay, or Sales Navigator.
        </p>
        <div className="mt-8 flex gap-3">
          <a href="/icp" className="inline-block rounded-2xl px-6 py-3 bg-[#ed6666] text-white font-semibold shadow">
            Start ICP Wizard
          </a>
          <a href="mailto:hello@yourdomain.com" className="inline-block rounded-2xl px-6 py-3 border border-[#552222]">
            Book a call
          </a>
        </div>
        <p className="mt-6 text-sm opacity-80">
          Built for founders and GTM leads. No fluff. Clear outputs.
        </p>
      </div>
    </main>
  );
}
