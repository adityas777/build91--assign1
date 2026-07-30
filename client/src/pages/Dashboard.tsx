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
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-6 bg-slate-200 rounded w-48 animate-pulse"></div>
          <div className="h-4 bg-slate-200 rounded w-96 mt-2 animate-pulse"></div>
        </div>

        {/* Skeletons for KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg border border-slate-200 flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 bg-slate-100 rounded-md"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                <div className="h-5 bg-slate-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Skeletons for Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-5 rounded-lg border border-slate-200 space-y-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/3 border-b pb-2"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="flex justify-between items-center py-1">
                    <div className="h-3.5 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-3.5 bg-slate-200 rounded w-8"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3">
        <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
        <div>
          <h4 className="font-semibold text-xs uppercase tracking-wider">Error Loading Dashboard</h4>
          <p className="text-xs mt-1">Could not retrieve project summary statistics. Make sure the backend server and MongoDB are running.</p>
        </div>
      </div>
    );
  }

  const { projects, rooms, totalAssets, activeProjects } = summary;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Dashboard</h3>
        <p className="text-xs text-slate-500 mt-0.5">Overview of active rendering operations, pipelines, and assets.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center gap-3 shadow-sm hover:border-slate-300 transition-colors">
          <div className="bg-slate-100 text-slate-600 p-2.5 rounded-md">
            <FolderIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Total Projects</div>
            <div className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">{projects.total}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center gap-3 shadow-sm hover:border-slate-300 transition-colors">
          <div className="bg-slate-100 text-slate-600 p-2.5 rounded-md">
            <LayersIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Total Rooms</div>
            <div className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">{rooms.total}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center gap-3 shadow-sm hover:border-slate-300 transition-colors flex-1">
          <div className="bg-slate-100 text-slate-600 p-2.5 rounded-md">
            <TrendingUpIcon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Avg Room Progress</div>
            <div className="flex items-center gap-3 mt-0.5">
              <div className="text-xl font-bold text-slate-900 tracking-tight">{rooms.averageProgress}%</div>
              <div className="flex-1 h-2 bg-slate-100 rounded overflow-hidden min-w-[60px] border border-slate-200/50">
                <div 
                  className="h-full bg-blue-600 rounded" 
                  style={{ width: `${rooms.averageProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center gap-3 shadow-sm hover:border-slate-300 transition-colors">
          <div className="bg-slate-100 text-slate-600 p-2.5 rounded-md">
            <PaperclipIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">CAD & Deliverables</div>
            <div className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">{totalAssets}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Status Summary */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-100 pb-2">Projects by Status</h4>
          <div className="space-y-2.5">
            {Object.entries(projects.byStatus).map(([status, count]) => {
              const colors: Record<string, string> = {
                Submitted: "bg-slate-50 text-slate-600 border border-slate-200",
                Approved: "bg-blue-50 text-blue-700 border border-blue-100",
                "In Progress": "bg-indigo-50 text-indigo-700 border border-indigo-100",
                Review: "bg-amber-50 text-amber-700 border border-amber-200",
                Done: "bg-emerald-50 text-emerald-700 border border-emerald-100",
              };

              return (
                <div key={status} className="flex justify-between items-center py-0.5">
                  <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded border ${colors[status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                    {status}
                  </span>
                  <span className="font-bold text-slate-800 text-xs">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Room Stage Summary */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-100 pb-2">Rooms by Production Stage</h4>
          <div className="space-y-2.5">
            {Object.entries(rooms.byStage).map(([stage, count]) => (
              <div key={stage} className="flex justify-between items-center text-xs py-0.5">
                <span className="text-slate-600 font-semibold">{stage}</span>
                <span className="bg-slate-50 text-slate-700 font-bold border border-slate-200 px-2 py-0.5 rounded text-[10px]">
                  {count} {count === 1 ? "room" : "rooms"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Active Projects List */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-100 pb-2">Active Studio Pipelines</h4>
            {activeProjects.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-8 italic font-medium">No active pipelines found.</div>
            ) : (
              <div className="space-y-3">
                {activeProjects.map((proj) => (
                  <div key={proj._id} className="flex justify-between items-center text-xs p-2.5 border border-slate-100 rounded-md bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div>
                      <div className="font-bold text-slate-800">{proj.name}</div>
                      <div className="text-[9px] uppercase font-bold text-slate-400 mt-0.5">Client: {proj.client}</div>
                    </div>
                    <Link 
                      to={`/projects/${proj._id}`}
                      className="text-blue-600 hover:text-blue-800 transition-colors p-1.5 hover:bg-slate-200 rounded border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <ArrowRightIcon className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link 
              to="/projects"
              className="text-[10px] uppercase tracking-wider font-bold text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 hover:gap-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Pipeline Index <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
