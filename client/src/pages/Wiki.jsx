import { useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function Wiki() {
  const { id } = useParams();

  return (
    <div className="flex bg-black text-white min-h-screen">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="max-w-4xl">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Engineering Wiki
          </h1>
          <p className="text-zinc-500 text-xs font-mono mt-2">
            Workspace {id?.slice(-6)} · living docs for architecture, runbooks, and decisions.
          </p>

          <div className="mt-6 bg-zinc-950/40 border border-zinc-900 rounded-2xl p-5">
            <p className="text-zinc-300 text-sm">Wiki surface is now connected in navigation and ready for collaborative page work.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
