export default function StatusPanel({ icon, title, children, actions, busy = false }) {
  const Icon = icon;
  return (
    <main className="grid min-h-dvh place-items-center bg-gray-50 p-4 sm:p-8">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white px-5 py-8 text-center shadow-sm sm:px-9 sm:py-11">
        <div role="status" aria-busy={busy}>
          <span className="mx-auto mb-5 grid size-12 place-items-center rounded-xl bg-[#e8fbfc] text-[#106579]">
            <Icon size={23} aria-hidden="true" className={busy ? "animate-spin" : undefined} />
          </span>
          <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
          <div className="mt-3 text-sm leading-relaxed text-gray-500">{children}</div>
        </div>
        {actions && <div className="mt-6 flex flex-wrap justify-center gap-2">{actions}</div>}
      </div>
    </main>
  );
}
