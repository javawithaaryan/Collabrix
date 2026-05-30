import React, { useState } from 'react';

export default function Workspace() {
  const [title, setTitle] = useState(""); 
  const [description, setDescription] = useState("");
  const [workspaces, setWorkspaces] = useState([]);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Form submit handler connected to the button
  const handleSaveWorkspace = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Workspace name is required");
      return;
    }

    try {
      setError(null);
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: title.trim(), 
          description: description.trim() || "" 
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create workspace");
      }
      
      const newWorkspace = await response.json();
      setWorkspaces([...workspaces, newWorkspace]);
      setTitle(""); 
      setDescription("");
      setError(null); 
      setShowForm(false);
      
    } catch (err) {
      console.error("Workspace Error:", err);
      setError(err.message || "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-[#060b13] text-white p-6">
      {/* Header section with toggle option */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Workspaces</h1>
          <p className="text-sm text-slate-400">Manage and explore your team spaces</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded-md transition-all"
        >
          {showForm ? "Close Panel" : "Create Workspace"}
        </button>
      </div>

      {/* Workspace Creation Panel */}
      {showForm && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-6 max-w-2xl mb-8">
          <form onSubmit={handleSaveWorkspace} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Workspace Name</label>
              <input 
                type="text" 
                placeholder="Workspace name..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#15203b] border border-slate-700 rounded p-2.5 text-sm focus:outline-none focus:border-blue-500 text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Description</label>
              <textarea 
                placeholder="Workspace description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="3"
                className="w-full bg-[#15203b] border border-slate-700 rounded p-2.5 text-sm focus:outline-none focus:border-blue-500 text-white"
              />
            </div>

            {error && <p className="text-red-500 text-sm font-medium mt-2">{error}</p>}

            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-medium text-sm px-4 py-2 rounded transition-all">
              Save Workspace
            </button>
          </form>
        </div>
      )}

      {/* Core Workspace Sections (Top Functional Utilities) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#0f172a] border border-slate-800 p-5 rounded-xl hover:border-blue-500/30 transition-all">
          <div className="text-blue-500 text-2xl mb-2">⚡</div>
          <h3 className="text-base font-semibold mb-1 text-slate-200">Real-time Editor</h3>
          <p className="text-xs text-slate-400">Launch a multi-user shared coding session with real-time feedback.</p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 p-5 rounded-xl hover:border-blue-500/30 transition-all">
          <div className="text-emerald-500 text-2xl mb-2">📝</div>
          <h3 className="text-base font-semibold mb-1 text-slate-200">Workspace Documentation</h3>
          <p className="text-xs text-slate-400">Keep clean technical specifications and structural blueprints updated.</p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 p-5 rounded-xl hover:border-blue-500/30 transition-all">
          <div className="text-amber-500 text-2xl mb-2">📊</div>
          <h3 className="text-base font-semibold mb-1 text-slate-200">Sprint Tracking</h3>
          <p className="text-xs text-slate-400">Manage pipeline delivery cards across cross-functional streams.</p>
        </div>
      </div>

      {/* Visual Placeholder for Undefined / Experimental Views */}
      <div className="border border-dashed border-slate-800 bg-[#090f1c]/40 rounded-xl p-8 text-center">
        <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase">Extended Modules Calibrating</p>
        <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">CI/CD automation pipelines and telemetry server logs will render here following core updates.</p>
      </div>
    </div>
  );
}