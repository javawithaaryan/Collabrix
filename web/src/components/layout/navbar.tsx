import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export function Navbar() {
  return (
    <nav className="w-full h-14 px-6 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between shrink-0">
      
      {/* Left Side: Brand & Logo */}
      <Link href="/" className="flex items-center gap-2 text-zinc-100 font-bold tracking-tight text-lg transition-opacity hover:opacity-80">
        <div className="w-6 h-6 bg-indigo-500 rounded-md flex items-center justify-center shadow-sm shadow-indigo-500/20">
          <span className="text-white text-xs font-black">C</span>
        </div>
        Collabrix
      </Link>

      {/* Right Side: Navigation Links & User Profile */}
      <div className="flex items-center gap-4">
        
        {/* The Clerk User Profile Dropdown (v6 Compatible) */}
        <UserButton 
          appearance={{
            elements: {
              userButtonAvatarBox: "w-8 h-8 rounded-md border border-zinc-800 shadow-sm",
              userButtonPopoverCard: "bg-zinc-950 border border-zinc-800 shadow-2xl",
              userButtonPopoverActionButton: "hover:bg-zinc-900 text-zinc-300 transition-colors",
              userButtonPopoverActionButtonText: "text-zinc-300 font-medium",
              userPreviewSecondaryIdentifier: "text-zinc-500",
              userPreviewMainIdentifier: "text-zinc-200 font-semibold"
            }
          }}
        />
      </div>
    </nav>
  );
}