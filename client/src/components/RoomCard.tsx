import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateRoom, deleteRoom } from "../api/rooms";
import type { Room } from "../api/rooms";
import { 
  UserIcon, 
  CalendarIcon, 
  LayersIcon, 
  Trash2Icon, 
  MessageSquareIcon,
  CheckIcon
} from "lucide-react";
import AssetManager from "./AssetManager";

interface RoomCardProps {
  room: Room;
}

export default function RoomCard({ room }: RoomCardProps) {
  const queryClient = useQueryClient();
  
  // Local form states
  const [assignedArtist, setAssignedArtist] = useState(room.assignedArtist || "");
  const [targetDeliveryDate, setTargetDeliveryDate] = useState(
    room.targetDeliveryDate ? new Date(room.targetDeliveryDate).toISOString().substring(0, 10) : ""
  );
  const [stage, setStage] = useState(room.stage);
  const [progress, setProgress] = useState(room.progress);
  const [reviewerComments, setReviewerComments] = useState(room.reviewerComments || "");
  
  const [isSaved, setIsSaved] = useState(false);

  // Check if form is dirty
  const isDirty = 
    assignedArtist !== (room.assignedArtist || "") ||
    targetDeliveryDate !== (room.targetDeliveryDate ? new Date(room.targetDeliveryDate).toISOString().substring(0, 10) : "") ||
    stage !== room.stage ||
    progress !== room.progress ||
    reviewerComments !== (room.reviewerComments || "");

  // Update room mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<Room>) => updateRoom(room._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms", room.projectId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }
  });

  // Delete room mutation
  const deleteMutation = useMutation({
    mutationFn: deleteRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms", room.projectId] });
      queryClient.invalidateQueries({ queryKey: ["assets", room.projectId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    }
  });

  const handleSave = () => {
    updateMutation.mutate({
      assignedArtist,
      targetDeliveryDate: targetDeliveryDate ? new Date(targetDeliveryDate).toISOString() : undefined,
      stage,
      progress,
      reviewerComments,
    });
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete room "${room.name}"? This will delete all its S3 assets too.`)) {
      deleteMutation.mutate(room._id);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_12px_35px_rgba(59,130,246,0.04)] transition-all duration-300 overflow-hidden flex flex-col justify-between">
      {/* Header */}
      <div className="bg-slate-50/40 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h4 className="font-extrabold text-slate-800 text-sm tracking-tight">{room.name}</h4>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Production Scene</span>
        </div>
        <button
          onClick={handleDelete}
          className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 border border-transparent hover:border-slate-100 transition-colors"
          title="Delete Room"
        >
          <Trash2Icon className="w-4 h-4" />
        </button>
      </div>

      {/* Body / Settings */}
      <div className="p-6 space-y-4">
        {/* Artist Input */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
            <UserIcon className="w-3.5 h-3.5 text-slate-400" /> Assigned Artist
          </label>
          <input
            type="text"
            value={assignedArtist}
            onChange={(e) => setAssignedArtist(e.target.value)}
            placeholder="Artist Name"
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          />
        </div>

        {/* Delivery Date */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" /> Target Delivery Date
          </label>
          <input
            type="date"
            value={targetDeliveryDate}
            onChange={(e) => setTargetDeliveryDate(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          />
        </div>

        {/* Production Stage */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
            <LayersIcon className="w-3.5 h-3.5 text-slate-400" /> Production Stage
          </label>
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value as any)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 cursor-pointer"
          >
            <option value="Modeling">Modeling</option>
            <option value="Internal Review">Internal Review</option>
            <option value="Rendering">Rendering</option>
            <option value="QA Review">QA Review</option>
            <option value="Final Renders">Final Renders</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {/* Progress Slider */}
        <div>
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            <span>Production Progress</span>
            <span className="text-blue-600 font-extrabold normal-case text-xs">{progress}%</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-100 border border-slate-200/50 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>

        {/* Reviewer Comments */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
            <MessageSquareIcon className="w-3.5 h-3.5 text-slate-400" /> Reviewer Comments
          </label>
          <textarea
            value={reviewerComments}
            onChange={(e) => setReviewerComments(e.target.value)}
            placeholder="Add comments, change requests, or QA feedback..."
            rows={2}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 resize-none"
          />
        </div>

        {/* Room Specific Assets Collapsible */}
        <div className="border-t border-slate-100 pt-4 mt-2">
          <AssetManager projectId={room.projectId} roomId={room._id} title="Scene Assets" />
        </div>
      </div>

      {/* Footer Save Area */}
      <div className="bg-slate-50/40 px-6 py-3 border-t border-slate-100 flex justify-between items-center h-14">
        <div>
          {isSaved && (
            <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
              <CheckIcon className="w-4 h-4" /> Saved
            </span>
          )}
        </div>
        
        <button
          onClick={handleSave}
          disabled={!isDirty || updateMutation.isPending}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md transition-all active:scale-95 ${
            isDirty 
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white cursor-pointer shadow-blue-500/10 hover:shadow-blue-500/20"
              : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/50"
          }`}
        >
          {updateMutation.isPending ? "Saving..." : "Save Scene"}
        </button>
      </div>
    </div>
  );
}
