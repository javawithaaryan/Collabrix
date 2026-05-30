import React, { useState } from 'react';

export default function ResourceHub() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#060b13] text-white p-6">
      {/* Header block containing the functional resource button option */}
      <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Resource Hub</h1>
          <p className="text-xs text-slate-400 mt-0.5">Curated engineering knowledge shared by the community</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-4 py-2 rounded transition-all"
        >
          + Share Resource
        </button>
      </div>

      {/* Your current collection grids and row items display smoothly down here */}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f172a] border border-slate-800 w-full max-w-sm rounded-lg p-5">
            <h3 className="text-sm font-bold text-slate-200 mb-3">Add Shared Engineering Resource</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Resource Name" className="w-full bg-[#15203b] border border-slate-700 rounded p-2 text-xs text-white focus:outline-none" />
              <input type="text" placeholder="URL Link" className="w-full bg-[#15203b] border border-slate-700 rounded p-2 text-xs text-white focus:outline-none" />
            </div>
            <div className="flex justify-end gap-2 mt-4 text-xs">
              <button onClick={() => setShowModal(false)} className="px-3 py-1.5 text-slate-400 hover:text-white">Close</button>
              <button className="bg-blue-600 px-3 py-1.5 rounded text-white">Publish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}