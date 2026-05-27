import { useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function Billing() {
  const { id } = useParams();

  return (
    <div className="flex bg-black text-white min-h-screen">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Billing
          </h1>
          <p className="text-zinc-500 text-xs font-mono mt-2">Workspace {id?.slice(-6)} settings.</p>

          <div className="mt-6 grid md:grid-cols-2 gap-4">
            <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-5">
              <p className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider">Free</p>
              <ul className="mt-2 text-sm text-zinc-300 space-y-1">
                <li>• 1 workspace</li>
                <li>• 3 projects</li>
                <li>• 5 members</li>
              </ul>
            </div>
            <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-5">
              <p className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider">Pro</p>
              <ul className="mt-2 text-sm text-zinc-300 space-y-1">
                <li>• Unlimited workspaces and projects</li>
                <li>• AI features</li>
                <li>• Advanced collaboration</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
