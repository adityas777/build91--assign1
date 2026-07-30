import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getProjects, createProject, deleteProject } from "../api/projects";
import { 
  PlusIcon, 
  SearchIcon, 
  Trash2Icon, 
  CalendarIcon, 
  BriefcaseIcon, 
  ChevronRightIcon 
} from "lucide-react";

export default function Projects() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [status, setStatus] = useState<"Submitted" | "Approved" | "In Progress" | "Review" | "Done">("Submitted");
  const [startDate, setStartDate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [dateError, setDateError] = useState("");

  // Query projects
  const { data: projects = [], isLoading, isError } = useQuery({
    queryKey: ["projects", statusFilter, searchQuery],
    queryFn: () => getProjects({ 
      ...(statusFilter && { status: statusFilter }), 
      ...(searchQuery && { search: searchQuery }) 
    }),
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setName("");
    setClientName("");
    setStatus("Submitted");
    setStartDate("");
    setTargetDate("");
    setErrorMessage("");
    setDateError("");
  };

  // Mutation to create a project
  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      closeModal();
    },
    onError: (error: any) => {
      setErrorMessage(error?.response?.data?.error?.message || "Failed to create project");
    }
  });

  // Mutation to delete a project
  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !clientName) {
      setErrorMessage("Project Name and Client Name are required");
      return;
    }

    if (startDate && targetDate) {
      const start = new Date(startDate);
      const target = new Date(targetDate);
      if (target < start) {
        setDateError("Target date cannot be before start date");
        return;
      }
    }

    createMutation.mutate({
      name,
      client: clientName,
      status,
      startDate: startDate || undefined,
      targetDate: targetDate || undefined,
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete project "${name}"? This will delete all rooms and S3 assets associated with it.`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Projects Pipeline</h3>
          <p className="text-sm text-slate-500 mt-1">Manage project pipelines and overall rendering statuses.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/25 transition-all active:scale-95"
        >
          <PlusIcon className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <SearchIcon className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search by project or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50/50"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-400 font-extrabold uppercase tracking-wider whitespace-nowrap">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-48 py-2 px-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50/50 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Approved">Approved</option>
            <option value="In Progress">In Progress</option>
            <option value="Review">Review</option>
            <option value="Done">Done</option>
          </select>
        </div>
      </div>

      {/* Projects Table / List */}
      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <div className="text-slate-500 font-medium animate-pulse">Loading projects list...</div>
        </div>
      ) : isError ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm border border-red-200">
          Failed to load projects. Ensure the server is online.
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white/85 text-center py-16 rounded-2xl border border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] text-slate-500 text-sm font-semibold">
          No projects found matching the criteria. Click "New Project" to add one!
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
          <table className="min-w-full divide-y divide-slate-100 text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Client</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Timeline</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white/20">
              {projects.map((proj) => {
                const statusColors: Record<string, string> = {
                  Submitted: "bg-slate-50 text-slate-600 border border-slate-200/60 shadow-sm",
                  Approved: "bg-blue-50 text-blue-700 border border-blue-100/60 shadow-sm",
                  "In Progress": "bg-indigo-50 text-indigo-700 border border-indigo-100/60 shadow-sm",
                  Review: "bg-amber-50/80 text-amber-700 border border-amber-200/40 shadow-sm",
                  Done: "bg-emerald-50 text-emerald-700 border border-emerald-100/60 shadow-sm",
                };

                return (
                  <tr key={proj._id} className="hover:bg-white/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/projects/${proj._id}`} className="font-bold text-blue-600 hover:text-blue-800 flex items-center gap-2 text-sm transition-colors">
                        <BriefcaseIcon className="w-4 h-4 text-slate-400" />
                        {proj.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 font-bold">
                      {proj.client}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-full ${statusColors[proj.status] || 'bg-slate-100'}`}>
                        {proj.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium text-slate-600">
                          {proj.startDate ? new Date(proj.startDate).toLocaleDateString() : "—"} to{" "}
                          {proj.targetDate ? new Date(proj.targetDate).toLocaleDateString() : "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleDelete(proj._id, proj.name)}
                          className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 bg-white border border-slate-200/60 shadow-sm transition-all"
                          title="Delete Project"
                        >
                          <Trash2Icon className="w-4 h-4" />
                        </button>
                        <Link
                          to={`/projects/${proj._id}`}
                          className="text-slate-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 bg-white border border-slate-200/60 shadow-sm transition-all"
                          title="View Details"
                        >
                          <ChevronRightIcon className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-200">
              <h4 className="font-bold text-lg text-slate-900">Create New Project</h4>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                {errorMessage && (
                  <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg border border-red-200">
                    {errorMessage}
                  </div>
                )}
                
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Project Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Modern Villa Interior"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Client Name *</label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Apex Designs"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Submitted">Submitted</option>
                    <option value="Approved">Approved</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Done">Done</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setDateError("");
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Target Date</label>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => {
                        setTargetDate(e.target.value);
                        setDateError("");
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {dateError && (
                      <p className="text-red-500 text-[10px] mt-1 font-semibold">{dateError}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
