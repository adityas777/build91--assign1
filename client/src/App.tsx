import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import { LayoutDashboard, FolderKanban } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gradient-to-tr from-slate-50 via-zinc-100 to-neutral-50 font-sans text-slate-800">
        {/* Sidebar */}
        <aside className="w-64 bg-white/90 backdrop-blur-md border-r border-slate-200/60 flex flex-col justify-between shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
          <div>
            <div className="p-6 border-b border-slate-100">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 p-1.5 rounded text-white font-black text-sm shadow-md shadow-blue-500/20">3D</span>
                Tracker Studio
              </h1>
            </div>
            
            <nav className="p-4 space-y-1">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02]"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                  }`
                }
              >
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </NavLink>
              
              <NavLink
                to="/projects"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02]"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                  }`
                }
              >
                <FolderKanban className="w-5 h-5" />
                Projects
              </NavLink>
            </nav>
          </div>
          
          <div className="p-4 border-t border-slate-100 text-[10px] uppercase tracking-wider font-bold text-slate-400 text-center">
            Build91 Studio Suite
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 h-16 flex items-center justify-between px-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <h2 className="text-sm uppercase tracking-wider font-extrabold text-slate-800">
              Pipeline Workspace
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-full border border-emerald-200/60 flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Studio Engine Online
              </span>
            </div>
          </header>
          
          {/* Viewport with Studio Backdrop Light Gradient */}
          <div className="flex-1 overflow-auto p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/30 via-slate-50/50 to-zinc-100/80">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetails />} />
              <Route path="*" element={<div className="p-6 text-center text-red-500 font-semibold">Page not found</div>} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
