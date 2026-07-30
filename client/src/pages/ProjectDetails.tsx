import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProject, updateProject } from "../api/projects";
import type { Project } from "../api/projects";
import { getRooms, createRoom } from "../api/rooms";
import RoomCard from "../components/RoomCard";
import AssetManager from "../components/AssetManager";
import { 
  ArrowLeftIcon, 
  BriefcaseIcon, 
  CalendarIcon, 
  LayersIcon, 
  PlusIcon,
  CheckCircle2Icon,
  AlertCircleIcon
} from "lucide-react";

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  
  // Room Creation state
  const [newRoomName, setNewRoomName] = useState("");
  const [roomError, setRoomError] = useState("");

  // 1. Fetch Project Info
  const { data: project, isLoading: isProjectLoading, isError: isProjectError } = useQuery({
    queryKey: ["project", id],
    queryFn: () => getProject(id!),
    enabled: !!id,
  });

  // 2. Fetch Rooms
  const { data: rooms = [], isLoading: isRoomsLoading, isError: isRoomsError } = useQuery({
    queryKey: ["rooms", id],
    queryFn: () => getRooms(id!),
    enabled: !!id,
  });

  // 3. Update Project Status mutation
  const updateProjectMutation = useMutation({
    mutationFn: (data: { status: Project["status"] }) => updateProject(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    }
  });

  // 4. Create Room mutation
  const createRoomMutation = useMutation({
    mutationFn: createRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setNewRoomName("");
      setRoomError("");
    },
    onError: (error: any) => {
      setRoomError(error?.response?.data?.error?.message || "Failed to create room");
    }
  });

  const handleStatusChange = (newStatus: Project["status"]) => {
    updateProjectMutation.mutate({ status: newStatus });
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) {
      setRoomError("Room name is required");
      return;
    }
    createRoomMutation.mutate({
      projectId: id!,
      name: newRoomName.trim(),
      assignedArtist: "",
      progress: 0,
      stage: "Modeling",
      reviewerComments: ""
    });
  };

  if (isProjectLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-slate-500 font-medium animate-pulse">Loading project details...</div>
      </div>
    );
  }

  if (isProjectError || !project) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3">
        <AlertCircleIcon className="w-5 h-5 flex-shrink-0" />
        <div>
          <h4 className="font-semibold">Project Not Found</h4>
          <p className="text-sm">We couldn't retrieve information for this project. Return to the projects listing page.</p>
          <Link to="/projects" className="text-blue-600 font-semibold text-sm underline mt-2 block">Back to Projects</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back button & Breadcrumbs */}
      <div>
        <Link to="/projects" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Projects List
        </Link>
      </div>

      {/* Project Banner Card */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-[0_8px_30px_rgba(59,130,246,0.04)] transition-shadow duration-300">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 text-blue-700 p-3.5 rounded-2xl shadow-inner">
            <BriefcaseIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-800">{project.name}</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
              Client: <span className="text-slate-600 font-extrabold">{project.client}</span>
              {project.startDate && ` • Started: ${new Date(project.startDate).toLocaleDateString()}`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          {/* Timeline */}
          {project.targetDate && (
            <div className="flex items-center gap-1.5 text-slate-600 text-xs bg-slate-50/80 border border-slate-200/60 px-3 py-2 rounded-xl shadow-sm font-semibold">
              <CalendarIcon className="w-4 h-4 text-slate-400" />
              <span>Target: {new Date(project.targetDate).toLocaleDateString()}</span>
            </div>
          )}

          {/* Status Select switcher */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Status:</span>
            <select
              value={project.status}
              onChange={(e) => handleStatusChange(e.target.value as Project["status"])}
              className="py-1.5 px-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 cursor-pointer"
            >
              <option value="Submitted">Submitted</option>
              <option value="Approved">Approved</option>
              <option value="In Progress">In Progress</option>
              <option value="Review">Review</option>
              <option value="Done">Done</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column - Room Cards and creation */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
            <h4 className="font-extrabold text-slate-800 text-base uppercase tracking-wider flex items-center gap-2">
              <LayersIcon className="w-5 h-5 text-slate-400" />
              Production Scenes ({rooms.length})
            </h4>
          </div>

          {/* Add Room Inline Form */}
          <form onSubmit={handleCreateRoom} className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            <div className="flex gap-3">
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="e.g. Master Bedroom, Kitchen View"
                className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              />
              <button
                type="submit"
                disabled={createRoomMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
              >
                <PlusIcon className="w-4 h-4" />
                Add Room
              </button>
            </div>
            {roomError && (
              <p className="text-red-500 text-xs mt-2 font-semibold">{roomError}</p>
            )}
          </form>

          {/* Rooms Grid list */}
          {isRoomsLoading ? (
            <div className="text-center text-slate-400 py-12">Loading rooms...</div>
          ) : isRoomsError ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg text-xs">Failed to load project rooms.</div>
          ) : rooms.length === 0 ? (
            <div className="bg-white/80 border border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-2xl p-12 text-center text-slate-400 text-sm font-semibold">
              No rooms created for this project yet. Use the field above to add your first room!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rooms.map((room) => (
                <RoomCard key={room._id} room={room} />
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Project Attachments */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            <h4 className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-2">
              <CheckCircle2Icon className="w-4 h-4 text-slate-400" />
              General Deliverables
            </h4>
            <p className="text-[10px] font-semibold text-slate-400 mb-4 uppercase tracking-wider">
              Upload blueprints, layouts, or contracts.
            </p>
            <AssetManager projectId={project._id} roomId={null} title="General Files" />
          </div>
        </div>
      </div>
    </div>
  );
}
