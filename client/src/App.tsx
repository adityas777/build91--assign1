import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import { LayoutDashboard, FolderKanban } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-slate-50 font-sans text-slate-800 antialiased">
        {/* Sidebar */}
        <aside className="w-60 bg-white border-r border-slate-200 flex flex-col justify-between select-none">
          <div>
            <div className="p-4 border-b border-slate-200">
              <h1 className="text-sm font-bold tracking-tight text-slate-950 flex items-center gap-2">
                <span className="bg-blue-600 px-1.5 py-0.5 rounded text-white font-extrabold text-xs">3D</span>
                Project Tracker
              </h1>
            </div>
            
            <nav className="p-3 space-y-1">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isActive
                      ? "bg-slate-100 text-slate-900 border border-slate-200/50"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                  }`
                }
              >
                <LayoutDashboard className="w-4 h-4 text-slate-500" />
                Dashboard
              </NavLink>
              
              <NavLink
                to="/projects"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isActive
                      ? "bg-slate-100 text-slate-900 border border-slate-200/50"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                  }`
                }
              >
                <FolderKanban className="w-4 h-4 text-slate-500" />
                Projects
              </NavLink>
            </nav>
          </div>
          
          <div className="p-3 border-t border-slate-200 text-[10px] font-medium text-slate-400 text-center">
            Build91 MVP v1.0.0
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white border-b border-slate-200 h-12 flex items-center justify-between px-6">
            <h2 className="text-xs uppercase tracking-wider font-bold text-slate-500">
              Project Pipeline Manager
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-[10px] bg-slate-50 text-slate-600 font-bold px-2 py-0.5 border border-slate-200 rounded flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                API: Online
              </span>
            </div>
          </header>
          
          {/* Viewport */}
          <div className="flex-1 overflow-auto p-6 bg-slate-50">
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
