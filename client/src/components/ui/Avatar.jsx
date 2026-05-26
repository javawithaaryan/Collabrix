import { useMemo } from "react";

// Generate a deterministic and harmonious HSL color based on a string (e.g., name)
function stringToHslColor(str = "", saturation = 65, lightness = 55) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Extract initials from a user's full name (e.g., "Aaryan Patel" -> "AP")
function getInitials(name = "") {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "?";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({ src, alt = "User", size = "md", showRing = false, ringColor = "border-emerald-400" }) {
  const initials = useMemo(() => getInitials(alt), [alt]);
  const backgroundColor = useMemo(() => stringToHslColor(alt), [alt]);

  const sizeClasses = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-xl",
  }[size] || "h-10 w-10 text-sm";

  return (
    <div className="relative inline-block select-none">
      {src ? (
        <img
          src={src}
          alt={alt}
          className={`${sizeClasses} rounded-full object-cover border border-zinc-800 shadow-inner`}
          onError={(e) => {
            // fallback if image link fails
            e.target.style.display = "none";
          }}
        />
      ) : (
        <div
          style={{ backgroundColor }}
          className={`${sizeClasses} rounded-full flex items-center justify-center font-extrabold text-white shadow-inner tracking-wider border border-white/10`}
          title={alt}
        >
          {initials}
        </div>
      )}

      {/* Optional online/offline indicator ring */}
      {showRing && (
        <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-black ${ringColor}`} />
      )}
    </div>
  );
}
