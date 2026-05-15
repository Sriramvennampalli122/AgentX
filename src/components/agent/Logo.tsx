export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary glow-primary ring-1 ring-white/20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent" />
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6 text-white relative z-10"
        >
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      </div>
      <div className="flex flex-col">
        <span className="font-headline text-2xl font-black tracking-tight text-white leading-none">
          AGENT<span className="text-primary">X</span>
        </span>
        <span className="text-[8px] font-bold text-muted-foreground/60 uppercase tracking-[0.3em] mt-1">Reasoning Engine</span>
      </div>
    </div>
  );
}