import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getDashboardSummary } from "../api/dashboard";
import { 
  FolderIcon, 
  LayersIcon, 
  PaperclipIcon, 
  TrendingUpIcon, 
  AlertCircleIcon, 
  ArrowRightIcon 
} from "lucide-react";

export default function Dashboard() {
  const { data: summary, isLoading, isError } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: getDashboardSummary,
    refetchInterval: 10000, // Autorefresh every 10 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500 font-medium animate-pulse">Loading dashboard statistics...</div>
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3">
        <AlertCircleIcon className="w-5 h-5 flex-shrink-0" />
        <div>
          <h4 className="font-semibold">Error Loading Dashboard</h4>
          <p className="text-sm">Could not retrieve project summary statistics. Make sure the backend server and MongoDB are running.</p>
        </div>
      </div>
    );
  }

  const { projects, rooms, totalAssets, activeProjects } = summary;

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-slate-900">Dashboard</h3>
        <p className="text-sm text-slate-500 mt-1">Overview of rendering operations, project pipelines, and asset statuses.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-center gap-4 hover:shadow-[0_8px_30px_rgba(59,130,246,0.05)] hover:-translate-y-0.5 transition-all duration-300">
          <div className="bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 text-blue-600 p-3.5 rounded-xl shadow-inner">
            <FolderIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Projects</div>
            <div className="text-3xl font-extrabold text-slate-800 mt-1">{projects.total}</div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-center gap-4 hover:shadow-[0_8px_30px_rgba(99,102,241,0.05)] hover:-translate-y-0.5 transition-all duration-300">
          <div className="bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 text-indigo-600 p-3.5 rounded-xl shadow-inner">
            <LayersIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Rooms</div>
            <div className="text-3xl font-extrabold text-slate-800 mt-1">{rooms.total}</div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-center gap-4 hover:shadow-[0_8px_30px_rgba(16,185,129,0.05)] hover:-translate-y-0.5 transition-all duration-300 flex-1">
          <div className="bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 text-emerald-600 p-3.5 rounded-xl shadow-inner">
            <TrendingUpIcon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Avg Room Progress</div>
            <div className="flex items-center gap-3 mt-1">
              <div className="text-3xl font-extrabold text-slate-800">{rooms.averageProgress}%</div>
              <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden min-w-[70px] border border-slate-200/50">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" 
                  style={{ width: `${rooms.averageProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-center gap-4 hover:shadow-[0_8px_30px_rgba(168,85,247,0.05)] hover:-translate-y-0.5 transition-all duration-300">
          <div className="bg-gradient-to-tr from-purple-500/10 to-pink-500/10 text-purple-600 p-3.5 rounded-xl shadow-inner">
            <PaperclipIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">CAD & Deliverables</div>
            <div className="text-3xl font-extrabold text-slate-800 mt-1">{totalAssets}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Project Status Summary */}
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] lg:col-span-1">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-100 pb-2">Projects by Status</h4>
          <div className="space-y-3.5">
            {Object.entries(projects.byStatus).map(([status, count]) => {
              const colors: Record<string, string> = {
                Submitted: "bg-slate-50 text-slate-600 border border-slate-200/60 shadow-sm",
                Approved: "bg-blue-50 text-blue-700 border border-blue-100/60 shadow-sm",
                "In Progress": "bg-indigo-50 text-indigo-700 border border-indigo-100/60 shadow-sm",
                Review: "bg-amber-50/80 text-amber-700 border border-amber-200/40 shadow-sm",
                Done: "bg-emerald-50 text-emerald-700 border border-emerald-100/60 shadow-sm",
              };

              return (
                <div key={status} className="flex justify-between items-center py-1">
                  <span className={`text-xs font-extrabold px-3 py-1.5 rounded-full ${colors[status] || 'bg-slate-100'}`}>
                    {status}
                  </span>
                  <span className="font-extrabold text-slate-800 text-sm">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Room Stage Summary */}
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] lg:col-span-1">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-100 pb-2">Rooms by Production Stage</h4>
          <div className="space-y-3.5">
            {Object.entries(rooms.byStage).map(([stage, count]) => (
              <div key={stage} className="flex justify-between items-center text-sm py-1">
                <span className="text-slate-600 font-semibold">{stage}</span>
                <span className="bg-slate-50 text-slate-700 font-bold border border-slate-200/60 px-3 py-1 rounded-lg text-xs">
                  {count} {count === 1 ? "room" : "rooms"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Active Projects List */}
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] lg:col-span-1 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-100 pb-2">Active Studio Pipelines</h4>
            {activeProjects.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-8 italic">No active pipelines found.</div>
            ) : (
              <div className="space-y-4">
                {activeProjects.map((proj) => (
                  <div key={proj._id} className="flex justify-between items-center text-sm p-3 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="font-bold text-slate-800">{proj.name}</div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">Client: {proj.client}</div>
                    </div>
                    <Link 
                      to={`/projects/${proj._id}`}
                      className="text-blue-600 hover:text-blue-800 transition-colors p-2 hover:bg-blue-50 rounded-lg shadow-sm bg-white border border-slate-200/60"
                    >
                      <ArrowRightIcon className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <Link 
              to="/projects"
              className="text-xs uppercase tracking-wider font-extrabold text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 hover:gap-2 transition-all"
            >
              Pipeline Index <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
