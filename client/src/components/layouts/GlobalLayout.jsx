import Navbar from "../Navbar";

export default function GlobalLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar />
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
