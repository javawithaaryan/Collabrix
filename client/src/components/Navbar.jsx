import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import WorkspaceSwitcher from './WorkspaceSwitcher';

export default function Navbar() {
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const navigate = useNavigate();

  // Fetch workspaces on component mount to feed the switcher
  useEffect(() => {
    fetch('/api/workspaces')
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load spaces");
        return res.json();
      })
      .then((data) => {
        if (data && data.length > 0) {
          setWorkspaces(data);
          setCurrentWorkspace(data[0]); // Default to the first active workspace
        }
      })
      .catch((err) => console.error("Navbar workspace fetch error:", err));
  }, []);

  // Triggers context redirect when selecting a workspace from the dropdown
  const handleWorkspaceChange = (workspace) => {
    setCurrentWorkspace(workspace);
    navigate(`/workspace/${workspace._id || workspace.id}`);
  };

  return (
    <nav className="bg-[#060b13] border-b border-slate-800 px-6 py-3 flex items-center justify-between text-white">
      {/* Left side: Brand Logo & Context Workspace Switcher */}
      <div className="flex items-center gap-2">
        <Link to="/dashboard" className="flex items-center gap-2 group">
          <div className="bg-blue-600 text-white font-bold p-1.5 rounded text-xs transition-transform group-hover:scale-105">
            C
          </div>
          <span className="font-bold text-base tracking-wide text-slate-100 group-hover:text-white">
            Collabrix
          </span>
        </Link>

        {/* Dynamic Navigation Dropdown Switcher */}
        <WorkspaceSwitcher 
          workspaces={workspaces} 
          currentWorkspace={currentWorkspace} 
          onSelectWorkspace={handleWorkspaceChange} 
        />
      </div>

      {/* Right side: Core Application Navigation Links */}
      <div className="flex items-center gap-6 text-xs font-medium text-slate-400">
        <Link 
          to="/dashboard" 
          className="hover:text-white transition-colors duration-150"
        >
          Dashboard
        </Link>
        <Link 
          to="/workspace" 
          className="hover:text-white transition-colors duration-150"
        >
          My Workspaces
        </Link>
        <Link 
          to="/resources" 
          className="hover:text-white transition-colors duration-150"
        >
          Resource Hub
        </Link>
      </div>
    </nav>
  );
}