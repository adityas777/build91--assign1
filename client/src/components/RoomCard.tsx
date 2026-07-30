import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateRoom, deleteRoom } from "../api/rooms";
import type { Room } from "../api/rooms";
import { useToast } from "../context/ToastContext";
import { 
  UserIcon, 
  CalendarIcon, 
  LayersIcon, 
  Trash2Icon, 
  MessageSquareIcon
} from "lucide-react";
import AssetManager from "./AssetManager";

interface RoomCardProps {
  room: Room;
}

export default function RoomCard({ room }: RoomCardProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Local form states
  const [assignedArtist, setAssignedArtist] = useState(room.assignedArtist || "");
  const [targetDeliveryDate, setTargetDeliveryDate] = useState(
    room.targetDeliveryDate ? new Date(room.targetDeliveryDate).toISOString().substring(0, 10) : ""
  );
  const [stage, setStage] = useState(room.stage);
  const [progress, setProgress] = useState(room.progress);
  const [reviewerComments, setReviewerComments] = useState(room.reviewerComments || "");

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
      toast("Scene details updated successfully", "success");
    },
    onError: (error: any) => {
      toast(error?.response?.data?.error?.message || "Failed to save scene changes", "error");
    }
  });

  // Delete room mutation
  const deleteMutation = useMutation({
    mutationFn: deleteRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms", room.projectId] });
      queryClient.invalidateQueries({ queryKey: ["assets", room.projectId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast("Scene deleted successfully", "success");
    },
    onError: (error: any) => {
      toast(error?.response?.data?.error?.message || "Failed to delete scene", "error");
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
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-colors">
      {/* Header */}
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h4 className="font-bold text-slate-900 text-xs tracking-tight">{room.name}</h4>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Production Scene</span>
        </div>
        <button
          onClick={handleDelete}
          className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-slate-100 border border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
          title="Delete Room"
        >
          <Trash2Icon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body / Settings */}
      <div className="p-4 space-y-3">
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
            className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
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
            className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
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
            className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 cursor-pointer"
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
              className="w-full h-1.5 bg-slate-100 border border-slate-200/50 rounded appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 resize-none"
          />
        </div>

        {/* Scene Specific Assets */}
        <div className="border-t border-slate-100 pt-3 mt-1">
          <AssetManager projectId={room.projectId} roomId={room._id} title="Scene Assets" />
        </div>
      </div>

      {/* Footer Save Area */}
      <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 flex justify-between items-center h-12">
        <div>
          {updateMutation.isPending && (
            <span className="text-[10px] text-slate-400 font-semibold">Saving...</span>
          )}
        </div>
        
        <button
          onClick={handleSave}
          disabled={!isDirty || updateMutation.isPending}
          className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            isDirty 
              ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/50 shadow-none"
          }`}
        >
          Save Details
        </button>
      </div>
    </div>
  );
}
