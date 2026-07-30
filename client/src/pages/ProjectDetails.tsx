import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProject, updateProject } from "../api/projects";
import type { Project } from "../api/projects";
import { getRooms, createRoom } from "../api/rooms";
import { useToast } from "../context/ToastContext";
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
  const { toast } = useToast();
  
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
      toast("Project status updated successfully", "success");
    },
    onError: (error: any) => {
      toast(error?.response?.data?.error?.message || "Failed to update status", "error");
    }
  });

  // 4. Create Room mutation
  const createRoomMutation = useMutation({
    mutationFn: createRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast("Scene created successfully", "success");
      setNewRoomName("");
      setRoomError("");
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.error?.message || "Failed to create room";
      setRoomError(msg);
      toast(msg, "error");
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
      <div className="space-y-6">
        {/* Banner Skeleton */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 w-10 h-10 rounded"></div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 rounded w-48"></div>
              <div className="h-3 bg-slate-200 rounded w-32"></div>
            </div>
          </div>
          <div className="h-8 bg-slate-100 rounded w-24"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-4 bg-slate-200 rounded w-40 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3 animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-7 bg-slate-100 rounded w-full"></div>
                  <div className="h-7 bg-slate-100 rounded w-full"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/3"></div>
              <div className="h-12 bg-slate-100 rounded w-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isProjectError || !project) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3">
        <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
        <div>
          <h4 className="font-bold text-xs uppercase tracking-wider">Project Not Found</h4>
          <p className="text-xs mt-1">We couldn't retrieve information for this project. Return to the projects listing page.</p>
          <Link to="/projects" className="text-blue-600 font-bold text-xs underline mt-2 block focus:outline-none focus:ring-2 focus:ring-blue-500">Back to Projects</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Back button & Breadcrumbs */}
      <div>
        <Link to="/projects" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded">
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          Back to Projects List
        </Link>
      </div>

      {/* Project Banner Card */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 text-slate-600 p-2.5 rounded-md">
            <BriefcaseIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-tight">{project.name}</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              Client: <span className="text-slate-600 font-extrabold">{project.client}</span>
              {project.startDate && ` • Started: ${new Date(project.startDate).toLocaleDateString()}`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Timeline */}
          {project.targetDate && (
            <div className="flex items-center gap-1.5 text-slate-600 text-xs bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded font-semibold">
              <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Target: {new Date(project.targetDate).toLocaleDateString()}</span>
            </div>
          )}

          {/* Status Select switcher */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Status:</span>
            <select
              value={project.status}
              onChange={(e) => handleStatusChange(e.target.value as Project["status"])}
              className="py-1.5 px-2.5 border border-slate-200 rounded text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 cursor-pointer"
            >
              {(() => {
                const PROJECT_FLOW = ["Submitted", "Approved", "In Progress", "Review", "Done"];
                const currentStatusIdx = PROJECT_FLOW.indexOf(project.status);
                const allowedStatuses = PROJECT_FLOW.filter((_, idx) => Math.abs(idx - currentStatusIdx) <= 1);
                return allowedStatuses.map((statusVal) => (
                  <option key={statusVal} value={statusVal}>
                    {statusVal}
                  </option>
                ));
              })()}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column - Room Cards and creation */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <h4 className="font-extrabold text-slate-800 text-[10px] uppercase tracking-wider flex items-center gap-2">
              <LayersIcon className="w-4 h-4 text-slate-400" />
              Production Scenes ({rooms.length})
            </h4>
          </div>

          {/* Add Room Inline Form */}
          <form onSubmit={handleCreateRoom} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex gap-2">
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="e.g. Master Bedroom, Kitchen View"
                className="flex-1 px-3 py-1.5 border border-slate-200 rounded text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              />
              <button
                type="submit"
                disabled={createRoomMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                Add Room
              </button>
            </div>
            {roomError && (
              <p className="text-red-500 text-xs mt-2 font-semibold">{roomError}</p>
            )}
          </form>

          {/* Rooms Grid list */}
          {isRoomsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3 animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-6 bg-slate-100 rounded w-full"></div>
                  <div className="h-6 bg-slate-100 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : isRoomsError ? (
            <div className="bg-red-50 text-red-700 p-3 rounded text-xs border border-red-200">Failed to load project rooms.</div>
          ) : rooms.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-8 text-center flex flex-col items-center justify-center gap-3">
              <LayersIcon className="w-8 h-8 text-slate-300 animate-pulse" />
              <div>
                <p className="text-xs font-bold text-slate-800">No rooms created yet</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-sm">This project does not have any active scenes configured. Use the field above to add your first room scene.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rooms.map((room) => (
                <RoomCard key={room._id} room={room} />
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Project Attachments */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <h4 className="font-bold text-slate-800 text-xs mb-0.5 flex items-center gap-2">
              <CheckCircle2Icon className="w-4 h-4 text-slate-400" />
              General Deliverables
            </h4>
            <p className="text-[10px] text-slate-400 font-semibold mb-3 uppercase tracking-wider">
              Upload overall blueprint layouts.
            </p>
            <AssetManager projectId={project._id} roomId={null} title="General Files" />
          </div>
        </div>
      </div>
    </div>
  );
}
