import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { projectService } from "../services/project.service";
import { workspaceService } from "../services/workspace.service";
import { useWorkspace } from "../context/WorkspaceContext";
import { useNotifications } from "../context/NotificationContext";

export default function Projects() {
  const { id: workspaceId } = useParams();
  const navigate = useNavigate();
  const { activeWorkspace, can } = useWorkspace();
  const { triggerToast } = useNotifications();

  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals / forms
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // Form Fields
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [projectStatus, setProjectStatus] = useState("Active");
  const [projectRoadmap, setProjectRoadmap] = useState("");
  const [projectProgress, setProjectProgress] = useState(0);
  const [projectMembers, setProjectMembers] = useState([]);
  
  // Milestones / Releases sub-forms
  const [milestones, setMilestones] = useState([]);
  const [releases, setReleases] = useState([]);

  // Active View Tab: "list" | "roadmap"
  const [activeTab, setActiveTab] = useState("list");

  const loadWorkspaceData = async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const [projList, memList] = await Promise.all([
        projectService.getProjectsByWorkspace(workspaceId),
        workspaceService.getMembers(workspaceId),
      ]);
      setProjects(projList || []);
      setMembers(memList || []);
    } catch (err) {
      console.error("Failed to load projects/members:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaceData();
  }, [workspaceId]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectName.trim() || !workspaceId) return;

    try {
      const created = await projectService.createProject(
        projectName.trim(),
        projectDesc.trim(),
        workspaceId
      );

      // Now update the created project with extra planning fields
      const updated = await projectService.updateProject(created._id, {
        status: projectStatus,
        roadmap: projectRoadmap.trim(),
        progress: Number(projectProgress),
        members: projectMembers,
        milestones,
        releases,
      });

      triggerToast(`Project "${projectName}" created successfully!`, "🎉");
      setShowCreateModal(false);
      resetForm();
      loadWorkspaceData();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to create project", "❌");
    }
  };

  const handleEditProject = (project) => {
    setSelectedProject(project);
    setProjectName(project.name || "");
    setProjectDesc(project.description || "");
    setProjectStatus(project.status || "Active");
    setProjectRoadmap(project.roadmap || "");
    setProjectProgress(project.progress || 0);
    setProjectMembers(project.members?.map((m) => m._id || m) || []);
    setMilestones(project.milestones || []);
    setReleases(project.releases || []);
    setShowEditModal(true);
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    if (!selectedProject || !projectName.trim()) return;

    try {
      await projectService.updateProject(selectedProject._id, {
        name: projectName.trim(),
        description: projectDesc.trim(),
        status: projectStatus,
        roadmap: projectRoadmap.trim(),
        progress: Number(projectProgress),
        members: projectMembers,
        milestones,
        releases,
      });

      triggerToast("Project configurations updated!", "✅");
      setShowEditModal(false);
      resetForm();
      loadWorkspaceData();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to update project", "❌");
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project and all its tasks?")) return;

    try {
      await projectService.deleteProject(projectId);
      triggerToast("Project deleted successfully", "🗑️");
      loadWorkspaceData();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to delete project", "❌");
    }
  };

  const resetForm = () => {
    setSelectedProject(null);
    setProjectName("");
    setProjectDesc("");
    setProjectStatus("Active");
    setProjectRoadmap("");
    setProjectProgress(0);
    setProjectMembers([]);
    setMilestones([]);
    setReleases([]);
  };

  const addMilestoneField = () => {
    setMilestones([...milestones, { name: "", description: "", status: "Not Started", progress: 0 }]);
  };

  const updateMilestoneField = (index, field, value) => {
    const updated = [...milestones];
    updated[index][field] = value;
    setMilestones(updated);
  };

  const removeMilestoneField = (index) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const addReleaseField = () => {
    setReleases([...releases, { version: "", name: "", description: "", status: "Planning" }]);
  };

  const updateReleaseField = (index, field, value) => {
    const updated = [...releases];
    updated[index][field] = value;
    setReleases(updated);
  };

  const removeReleaseField = (index) => {
    setReleases(releases.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm font-mono">Fetching project details...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-900 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Project Planning Center</h1>
          <p className="text-slate-400 text-sm mt-1">
            Scaffold roadmaps, structure milestones, define releases, and track progress metrics.
          </p>
        </div>
        {can("create_project") && (
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-lg shadow-indigo-600/10"
          >
            + Create Project
          </button>
        )}
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 border-b border-slate-900 pb-px">
        <button
          onClick={() => setActiveTab("list")}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 transition ${
            activeTab === "list" ? "border-indigo-500 text-white" : "border-transparent text-slate-500 hover:text-slate-400"
          }`}
        >
          Project Ledger ({projects.length})
        </button>
        <button
          onClick={() => setActiveTab("roadmap")}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 transition ${
            activeTab === "roadmap" ? "border-indigo-500 text-white" : "border-transparent text-slate-500 hover:text-slate-400"
          }`}
        >
          Roadmaps & Releases
        </button>
      </div>

      {activeTab === "list" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {projects.map((project) => (
            <div
              key={project._id}
              className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 hover:border-slate-800 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="text-base font-extrabold text-white hover:text-indigo-400 cursor-pointer" onClick={() => navigate(`/workspace/${workspaceId}/kanban?project=${project._id}`)}>
                      {project.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {project.description || "No description provided."}
                    </p>
                  </div>
                  <span
                    className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${
                      project.status === "Active"
                        ? "bg-indigo-950/40 text-indigo-400 border-indigo-900/30"
                        : project.status === "Released"
                        ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/30"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    {project.status}
                  </span>
                </div>

                {/* Owner and Members */}
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-[10px] text-slate-500 font-mono">Team:</span>
                  <div className="flex -space-x-2">
                    {project.members?.slice(0, 5).map((mem, idx) => (
                      <span
                        key={idx}
                        title={mem.name || "Member"}
                        className="w-5 h-5 rounded-full bg-slate-800 border border-slate-950 flex items-center justify-center text-[9px] font-bold text-slate-300 uppercase"
                      >
                        {mem.name?.[0] || "M"}
                      </span>
                    ))}
                    {project.members?.length > 5 && (
                      <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-950 flex items-center justify-center text-[8px] font-bold text-slate-500">
                        +{project.members.length - 5}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-5 space-y-1.5">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>Task progress completion</span>
                    <span>{project.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${project.progress || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-slate-900/80 mt-5 pt-3">
                <div className="flex gap-3 text-[10px] font-mono text-slate-500">
                  <span>🎯 {project.milestones?.length || 0} Milestones</span>
                  <span>📦 {project.releases?.length || 0} Releases</span>
                </div>
                {can("create_project") && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditProject(project)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-bold"
                    >
                      Configure
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project._id)}
                      className="text-xs text-rose-500 hover:text-rose-400 font-bold"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-900/20 border border-slate-900 rounded-3xl p-6 space-y-6">
          {projects.map((project) => (
            <div key={project._id} className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                  {project.name} Roadmaps
                </h3>
                <span className="text-[10px] font-mono text-slate-500">
                  Sprint Alignment: {project.roadmap || "Default Sprint Sequence"}
                </span>
              </div>

              {/* Milestones Ledger */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-4">
                  <h4 className="text-xs font-bold text-slate-300 mb-3">Milestones Execution Ledger</h4>
                  <div className="space-y-2">
                    {project.milestones && project.milestones.length > 0 ? (
                      project.milestones.map((m, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-900/40 p-2.5 rounded-lg border border-slate-850">
                          <div>
                            <span className="text-xs text-white font-bold">{m.name}</span>
                            <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{m.description}</p>
                          </div>
                          <span className={`text-[8px] font-bold font-mono px-2 py-0.5 rounded ${
                            m.status === "Completed" ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/30" : "bg-slate-800 text-slate-400"
                          }`}>
                            {m.status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-slate-500 font-mono">No milestone constraints created.</p>
                    )}
                  </div>
                </div>

                {/* Releases Ledger */}
                <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-4">
                  <h4 className="text-xs font-bold text-slate-300 mb-3">Releases Ship Ledger</h4>
                  <div className="space-y-2">
                    {project.releases && project.releases.length > 0 ? (
                      project.releases.map((r, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-900/40 p-2.5 rounded-lg border border-slate-850">
                          <div>
                            <span className="text-xs text-white font-mono font-bold">[{r.version}] {r.name}</span>
                            <p className="text-[10px] text-slate-550 mt-0.5">{r.description}</p>
                          </div>
                          <span className="text-[9px] text-indigo-400 font-mono">{r.status}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-slate-500 font-mono">No release packaging scheduled.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Project Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[150] p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 scrollbar-thin">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white">
                {showCreateModal ? "New Project Workspace" : "Configure Project"}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={showCreateModal ? handleCreateProject : handleUpdateProject} className="space-y-4 text-xs">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Project Name</label>
                  <input
                    type="text"
                    required
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. Realtime Sync Engine"
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 transition"
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Status</label>
                  <select
                    value={projectStatus}
                    onChange={(e) => setProjectStatus(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
                  >
                    <option>Planning</option>
                    <option>Active</option>
                    <option>In Review</option>
                    <option>Released</option>
                    <option>Archived</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Description</label>
                <textarea
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  placeholder="Outline the architecture scope, deployment guidelines, and general focus..."
                  rows={2}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none resize-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Roadmap Vibe / Focus</label>
                  <input
                    type="text"
                    value={projectRoadmap}
                    onChange={(e) => setProjectRoadmap(e.target.value)}
                    placeholder="e.g. Q3 Scalability & Cluster Sync"
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 transition"
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Progress Percentage</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={projectProgress}
                    onChange={(e) => setProjectProgress(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              {/* Assign Members */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Project Members</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {members.map((m) => {
                    const userId = m.user?._id || m.user;
                    const isChecked = projectMembers.includes(userId);
                    return (
                      <label key={userId} className="flex items-center gap-2 text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setProjectMembers(projectMembers.filter((id) => id !== userId));
                            } else {
                              setProjectMembers([...projectMembers, userId]);
                            }
                          }}
                          className="accent-indigo-500"
                        />
                        <span>{m.user?.name || "User"}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Milestones Section */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Milestones Roadmap</label>
                  <button
                    type="button"
                    onClick={addMilestoneField}
                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300"
                  >
                    + Add Milestone
                  </button>
                </div>
                <div className="space-y-2">
                  {milestones.map((m, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <input
                        type="text"
                        required
                        value={m.name}
                        onChange={(e) => updateMilestoneField(idx, "name", e.target.value)}
                        placeholder="Milestone Name"
                        className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white w-1/3 outline-none"
                      />
                      <input
                        type="text"
                        value={m.description}
                        onChange={(e) => updateMilestoneField(idx, "description", e.target.value)}
                        placeholder="Details"
                        className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white flex-1 outline-none"
                      />
                      <select
                        value={m.status}
                        onChange={(e) => updateMilestoneField(idx, "status", e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-[10px]"
                      >
                        <option>Not Started</option>
                        <option>In Progress</option>
                        <option>Completed</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeMilestoneField(idx)}
                        className="text-rose-500 hover:text-rose-400 font-bold px-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Releases Section */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Release Packaging Schedule</label>
                  <button
                    type="button"
                    onClick={addReleaseField}
                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300"
                  >
                    + Add Release
                  </button>
                </div>
                <div className="space-y-2">
                  {releases.map((r, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <input
                        type="text"
                        required
                        value={r.version}
                        onChange={(e) => updateReleaseField(idx, "version", e.target.value)}
                        placeholder="v1.0.0"
                        className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white w-20 outline-none"
                      />
                      <input
                        type="text"
                        required
                        value={r.name}
                        onChange={(e) => updateReleaseField(idx, "name", e.target.value)}
                        placeholder="Name"
                        className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white w-1/3 outline-none"
                      />
                      <input
                        type="text"
                        value={r.description}
                        onChange={(e) => updateReleaseField(idx, "description", e.target.value)}
                        placeholder="Ship Target / Focus"
                        className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white flex-1 outline-none"
                      />
                      <select
                        value={r.status}
                        onChange={(e) => updateReleaseField(idx, "status", e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-[10px]"
                      >
                        <option>Planning</option>
                        <option>Beta</option>
                        <option>Released</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeReleaseField(idx)}
                        className="text-rose-500 hover:text-rose-400 font-bold px-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-800 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 hover:bg-slate-800 rounded-xl font-bold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/10"
                >
                  Confirm Configurations
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
