import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTasks } from "../context/TaskContext";

export default function Tasks() {
  const { id: workspaceId } = useParams();
  const navigate = useNavigate();
  const {
    loading,
    searchQuery,
    priorityFilter,
    assigneeFilter,
    setSearchQuery,
    setPriorityFilter,
    setAssigneeFilter,
    getFilteredTasks,
  } = useTasks();

  const filteredTasks = getFilteredTasks();

  const handleRowClick = (task) => {
    // Navigate to the board and open the modal overlay immediately
    navigate(`/workspace/${workspaceId}/kanban?project=${task.project}&task=${task._id}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "done":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "in-progress":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "medium":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default:
        return "bg-slate-500/10 text-slate-500 border-slate-800";
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Workspace Task Ledger
        </h1>
        <p className="text-slate-500 text-xs font-mono mt-1">
          A consolidated view of all tasks across this workspace's boards and teams.
        </p>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col md:flex-row gap-4 bg-slate-900/40 border border-slate-850 p-4 rounded-2xl">
        {/* Search */}
        <div className="flex-1 flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs">
          <span className="text-slate-600 select-none">🔍</span>
          <input
            type="text"
            placeholder="Search by title, description or label..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-slate-300 outline-none w-full placeholder-slate-700 font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-slate-500 hover:text-white transition"
            >
              ✕
            </button>
          )}
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Assignee Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Assignee:</span>
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none cursor-pointer"
          >
            <option value="all">Everyone's Tasks</option>
            <option value="me">Assigned to Me</option>
            <option value="unassigned">Unassigned</option>
          </select>
        </div>
      </div>

      {/* Task List / Table */}
      <div className="bg-slate-900/20 border border-slate-850 rounded-2xl overflow-hidden shadow-xl shadow-slate-950/20">
        {loading ? (
          <div className="py-24 text-center text-slate-500 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-mono">Fetching workspace ledger...</span>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-24 text-center text-slate-500">
            <span className="text-3xl block mb-2">📋</span>
            <h4 className="text-sm font-bold text-slate-400 mb-1">No tasks matching filters</h4>
            <p className="text-[11px] text-slate-600">Try loosening your search terms or priority filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-850 bg-slate-900/30 text-slate-400 font-mono text-[9px] uppercase tracking-wider font-extrabold select-none">
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Milestone</th>
                  <th className="px-6 py-4">Assignee</th>
                  <th className="px-6 py-4">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/50">
                {filteredTasks.map((task) => (
                  <tr
                    key={task._id}
                    onClick={() => handleRowClick(task)}
                    className="hover:bg-slate-900/40 cursor-pointer transition duration-150 group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col min-w-0 max-w-md">
                        <span className="font-semibold text-slate-200 group-hover:text-white transition truncate">
                          {task.title}
                        </span>
                        {task.description && (
                          <span className="text-slate-500 text-[10px] truncate mt-0.5 max-w-sm">
                            {task.description}
                          </span>
                        )}
                        {task.labels && task.labels.length > 0 && (
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {task.labels.map((l, i) => (
                              <span
                                key={i}
                                className="text-[8px] font-bold bg-slate-800 text-slate-400 px-1 py-0.5 rounded border border-slate-750 uppercase tracking-wider"
                              >
                                {l}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getStatusColor(task.status)}`}>
                        {task.status || "todo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                        {task.priority || "medium"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-400 font-mono text-[10px]">
                      {task.milestone ? (
                        <span className="bg-indigo-950/20 text-indigo-400 border border-indigo-900/30 px-2 py-0.5 rounded">
                          {task.milestone}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                      {task.assignee ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5.5 h-5.5 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[9px] overflow-hidden text-white border border-indigo-500/20">
                            {task.assignee.avatar ? (
                              <img src={task.assignee.avatar} alt={task.assignee.name} className="w-full h-full object-cover" />
                            ) : (
                              task.assignee.name?.charAt(0).toUpperCase() || "?"
                            )}
                          </div>
                          <span className="text-[11px]">{task.assignee.name || "Teammate"}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600 font-mono text-[10px]">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono text-[10px]">
                      {new Date(task.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
