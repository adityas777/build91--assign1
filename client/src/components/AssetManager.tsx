import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import { getAssets, uploadAsset, deleteAsset } from "../api/assets";
import { 
  FileTextIcon, 
  FileImageIcon, 
  FileIcon, 
  DownloadIcon, 
  Trash2Icon, 
  UploadCloudIcon,
  Loader2Icon,
  AlertCircleIcon
} from "lucide-react";

interface AssetManagerProps {
  projectId: string;
  roomId?: string | null;
  title?: string;
}

export default function AssetManager({ projectId, roomId = null, title = "Project Assets & Files" }: AssetManagerProps) {
  const queryClient = useQueryClient();
  const [uploadError, setUploadError] = useState("");

  // Fetch assets
  const { data: assets = [], isLoading, isError } = useQuery({
    queryKey: ["assets", projectId, roomId],
    queryFn: () => getAssets(projectId, roomId),
  });

  // Upload asset mutation
  const uploadMutation = useMutation({
    mutationFn: uploadAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets", projectId, roomId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setUploadError("");
    },
    onError: (error: any) => {
      setUploadError(error?.response?.data?.error?.message || "Failed to upload file. Make sure file type is allowed (.pdf, .jpg, .jpeg, .png, .dwg, .dxf) and S3 keys are valid.");
    }
  });

  // Delete asset mutation
  const deleteMutation = useMutation({
    mutationFn: deleteAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets", projectId, roomId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    }
  });

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const formData = new FormData();
    formData.append("file", acceptedFiles[0]);
    formData.append("projectId", projectId);
    if (roomId) {
      formData.append("roomId", roomId);
    }
    
    uploadMutation.mutate(formData);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 25 * 1024 * 1024 // 25MB
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete file "${name}" from S3 and database?`)) {
      deleteMutation.mutate(id);
    }
  };

  // Helper to format file size
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Helper to get file icon
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    
    if (["jpg", "jpeg", "png"].includes(ext || "")) {
      return <FileImageIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />;
    }
    if (ext === "pdf") {
      return <FileTextIcon className="w-5 h-5 text-red-500 flex-shrink-0" />;
    }
    if (["dwg", "dxf"].includes(ext || "")) {
      return <FileIcon className="w-5 h-5 text-amber-600 flex-shrink-0" />; // CAD files
    }
    return <FileIcon className="w-5 h-5 text-slate-500 flex-shrink-0" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h5 className="font-bold text-[10px] uppercase tracking-wider text-slate-400">{title}</h5>
        <span className="text-[10px] text-slate-400 font-extrabold uppercase">Limit: 25MB</span>
      </div>

      {/* Drag and Drop Zone */}
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 ${
          isDragActive 
            ? "border-blue-500 bg-blue-50/50" 
            : "border-slate-200 hover:border-blue-400 bg-slate-50/30 hover:bg-slate-50/80"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-1.5">
          {uploadMutation.isPending ? (
            <>
              <Loader2Icon className="w-7 h-7 text-blue-500 animate-spin" />
              <p className="text-xs font-semibold text-slate-600">Uploading to S3...</p>
            </>
          ) : (
            <>
              <UploadCloudIcon className="w-7 h-7 text-slate-400" />
              <p className="text-xs font-bold text-slate-500">
                {isDragActive ? "Drop the file here" : "Upload deliverables"}
              </p>
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">PDF, CAD (DWG/DXF), JPG, PNG</p>
            </>
          )}
        </div>
      </div>

      {uploadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2">
          <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
          <span className="font-semibold">{uploadError}</span>
        </div>
      )}

      {/* Uploaded Assets List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-4">
          <Loader2Icon className="w-4 h-4 text-slate-400 animate-spin" />
        </div>
      ) : isError ? (
        <div className="text-xs text-red-500 font-semibold">Failed to load attachments</div>
      ) : assets.length === 0 ? (
        <div className="text-xs text-slate-400 text-center py-4 italic font-medium">No attachments uploaded yet.</div>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {assets.map((asset) => (
            <div 
              key={asset._id} 
              className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50/50 bg-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.01)] text-xs"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
                {getFileIcon(asset.fileName)}
                <div className="min-w-0">
                  <p className="font-bold text-slate-700 truncate" title={asset.fileName}>
                    {asset.fileName}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {formatBytes(asset.fileSize)} • {new Date(asset.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Download Link */}
                <a 
                  href={asset.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 bg-white border border-slate-200/60 shadow-sm transition-colors"
                  title="Download File"
                >
                  <DownloadIcon className="w-3.5 h-3.5" />
                </a>
                
                {/* Delete button */}
                <button
                  onClick={() => handleDelete(asset._id, asset.fileName)}
                  className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 bg-white border border-slate-200/60 shadow-sm transition-colors"
                  title="Delete File"
                  disabled={deleteMutation.isPending}
                >
                  <Trash2Icon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
