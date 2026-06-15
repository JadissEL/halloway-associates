export function ModalLogo({ size = "lg" }: { size?: "sm" | "lg" }) {
  const textClass = size === "lg" ? "text-4xl tracking-[0.35em]" : "text-xl tracking-[0.3em]";

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`silver-ring flex items-center justify-center rounded-2xl border border-[#c0c5ce]/20 bg-[#0e1016] ${
          size === "lg" ? "h-16 w-16" : "h-10 w-10"
        }`}
        aria-hidden
      >
        <svg
          viewBox="0 0 32 32"
          className={size === "lg" ? "h-8 w-8" : "h-5 w-5"}
          fill="none"
        >
          <path
            d="M6 22 L16 6 L26 22 Z"
            stroke="url(#silverGrad)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M10 22 L22 22"
            stroke="url(#silverGrad)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e8eaed" />
              <stop offset="50%" stopColor="#9aa3ad" />
              <stop offset="100%" stopColor="#c0c5ce" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <span className={`silver-text font-semibold ${textClass}`}>MODAL</span>
      {size === "lg" && (
        <span className="text-xs uppercase tracking-[0.25em] text-[#6b7280]">
          Internal ops
        </span>
      )}
    </div>
  );
}
