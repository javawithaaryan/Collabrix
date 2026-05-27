export default function Skeleton({ className = "", variant = "rect" }) {
  const baseClass = "bg-zinc-900/60 animate-pulse relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite] before:bg-gradient-to-r before:from-transparent before:via-zinc-800/10 before:to-transparent";
  
  let variantClass = "rounded-2xl";
  if (variant === "circle") {
    variantClass = "rounded-full";
  } else if (variant === "text") {
    variantClass = "rounded h-3.5 w-3/4";
  }

  return (
    <div className={`${baseClass} ${variantClass} ${className}`}>
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
