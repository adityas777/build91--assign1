import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getProjects, createProject, deleteProject } from "../api/projects";
import { useToast } from "../context/ToastContext";
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
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [density, setDensity] = useState<"compact" | "comfortable">("comfortable");
  
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
      toast("Project created successfully", "success");
      closeModal();
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.error?.message || "Failed to create project";
      setErrorMessage(msg);
      toast(msg, "error");
    }
  });

  // Mutation to delete a project
  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast("Project deleted successfully", "success");
    },
    onError: (error: any) => {
      toast(error?.response?.data?.error?.message || "Failed to delete project", "error");
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
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Projects</h3>
          <p className="text-xs text-slate-500 mt-0.5">Manage rendering production stages and deadlines.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          New Project
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <SearchIcon className="w-3.5 h-3.5" />
          </span>
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider whitespace-nowrap">Filter:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-40 py-1.5 px-2.5 border border-slate-200 rounded text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50/50 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Approved">Approved</option>
              <option value="In Progress">In Progress</option>
              <option value="Review">Review</option>
              <option value="Done">Done</option>
            </select>
          </div>

          {/* Density Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200/60 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setDensity("comfortable")}
              className={`px-2.5 py-1 text-[9px] uppercase font-bold rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                density === "comfortable"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Comfortable
            </button>
            <button
              type="button"
              onClick={() => setDensity("compact")}
              className={`px-2.5 py-1 text-[9px] uppercase font-bold rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                density === "compact"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Compact
            </button>
          </div>
        </div>
      </div>

      {/* Projects Table / List */}
      {isLoading ? (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden animate-pulse">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
            <div className="grid grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-3.5 bg-slate-200 rounded w-1/2"></div>
              ))}
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-4 py-3.5">
                <div className="grid grid-cols-5 gap-4 items-center">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-4 bg-slate-200 rounded w-20"></div>
                  <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                  <div className="h-7 bg-slate-200 rounded w-8 justify-self-end"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : isError ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg text-xs border border-red-200">
          Failed to load projects. Ensure the server is online.
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-lg border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-3">
          <div className="text-slate-400">
            <BriefcaseIcon className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-bold mt-2">No projects found</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-sm">No active pipeline configurations match your filter criteria. Create your first project to get started.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded text-[10px] uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className={`font-bold text-[10px] text-slate-400 uppercase tracking-wider ${
                  density === "compact" ? "px-4 py-2" : "px-6 py-3"
                }`}>Project Name</th>
                <th className={`font-bold text-[10px] text-slate-400 uppercase tracking-wider ${
                  density === "compact" ? "px-4 py-2" : "px-6 py-3"
                }`}>Client</th>
                <th className={`font-bold text-[10px] text-slate-400 uppercase tracking-wider ${
                  density === "compact" ? "px-4 py-2" : "px-6 py-3"
                }`}>Status</th>
                <th className={`font-bold text-[10px] text-slate-400 uppercase tracking-wider ${
                  density === "compact" ? "px-4 py-2" : "px-6 py-3"
                }`}>Timeline</th>
                <th className={`text-right font-bold text-[10px] text-slate-400 uppercase tracking-wider ${
                  density === "compact" ? "px-4 py-2" : "px-6 py-3"
                }`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {projects.map((proj) => {
                const statusColors: Record<string, string> = {
                  Submitted: "bg-slate-50 text-slate-600 border border-slate-200",
                  Approved: "bg-blue-50 text-blue-700 border border-blue-100",
                  "In Progress": "bg-indigo-50 text-indigo-700 border border-indigo-100",
                  Review: "bg-amber-50 text-amber-700 border border-amber-200",
                  Done: "bg-emerald-50 text-emerald-700 border border-emerald-100",
                };

                return (
                  <tr key={proj._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className={`whitespace-nowrap ${
                      density === "compact" ? "px-4 py-1.5" : "px-6 py-3"
                    }`}>
                      <Link 
                        to={`/projects/${proj._id}`} 
                        className="font-bold text-blue-600 hover:text-blue-800 flex items-center gap-2 text-xs transition-colors focus:outline-none focus:underline"
                      >
                        <BriefcaseIcon className="w-4 h-4 text-slate-400" />
                        {proj.name}
                      </Link>
                    </td>
                    <td className={`whitespace-nowrap text-xs text-slate-600 font-semibold ${
                      density === "compact" ? "px-4 py-1.5" : "px-6 py-3"
                    }`}>
                      {proj.client}
                    </td>
                    <td className={`whitespace-nowrap ${
                      density === "compact" ? "px-4 py-1.5" : "px-6 py-3"
                    }`}>
                      <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded border ${
                        statusColors[proj.status] || 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {proj.status}
                      </span>
                    </td>
                    <td className={`whitespace-nowrap text-xs text-slate-500 ${
                      density === "compact" ? "px-4 py-1.5" : "px-6 py-3"
                    }`}>
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-600">
                          {proj.startDate ? new Date(proj.startDate).toLocaleDateString() : "—"} to{" "}
                          {proj.targetDate ? new Date(proj.targetDate).toLocaleDateString() : "—"}
                        </span>
                      </div>
                    </td>
                    <td className={`whitespace-nowrap text-right text-xs ${
                      density === "compact" ? "px-4 py-1.5" : "px-6 py-3"
                    }`}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDelete(proj._id, proj.name)}
                          className="text-slate-400 hover:text-red-600 p-1.5 rounded hover:bg-slate-50 border border-slate-200/60 bg-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                          title="Delete Project"
                        >
                          <Trash2Icon className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          to={`/projects/${proj._id}`}
                          className="text-slate-400 hover:text-blue-600 p-1.5 rounded hover:bg-slate-50 border border-slate-200/60 bg-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                          title="View Details"
                        >
                          <ChevronRightIcon className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 bg-slate-900 bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="p-4 border-b border-slate-200">
              <h4 className="font-bold text-sm text-slate-900">Create New Project</h4>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="p-4 space-y-3">
                {errorMessage && (
                  <div className="bg-red-50 text-red-700 text-xs p-2.5 rounded border border-red-200 font-semibold">
                    {errorMessage}
                  </div>
                )}
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Project Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Modern Villa Interior"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Client Name *</label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Apex Designs"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Submitted">Submitted</option>
                    <option value="Approved">Approved</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Done">Done</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setDateError("");
                      }}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Target Date</label>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => {
                        setTargetDate(e.target.value);
                        setDateError("");
                      }}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {dateError && (
                      <p className="text-red-500 text-[10px] mt-1 font-semibold">{dateError}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-700 hover:bg-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
