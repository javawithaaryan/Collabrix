import React, { useState } from 'react';

export default function WorkspaceSwitcher({ workspaces, currentWorkspace, onSelectWorkspace }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block text-left ml-4 border-l border-slate-800 pl-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex justify-between items-center w-44 rounded-md border border-slate-800 bg-[#0f172a] px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-[#15203b] focus:outline-none transition-all"
      >
        <span className="truncate">{currentWorkspace?.name || "Switch Workspace"}</span>
        <svg className="ml-2 h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="origin-top-left absolute left-4 mt-2 w-48 rounded-md shadow-2xl bg-[#0f172a] border border-slate-800 z-50">
          <div className="py-1 max-h-48 overflow-y-auto">
            {workspaces.map((ws, index) => (
              <button
                key={ws._id || index}
                onClick={() => {
                  onSelectWorkspace(ws);
                  setIsOpen(false);
                }}
                className="w-full text-left block px-4 py-2 text-xs text-slate-300 hover:bg-slate-800/60 transition-colors"
              >
                {ws.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}