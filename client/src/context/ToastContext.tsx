import React, { createContext, useContext, useState, useCallback } from "react";
import { XIcon, CheckCircle2Icon, AlertCircleIcon } from "lucide-react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error";
}

interface ToastContextType {
  toast: (message: string, type: "success" | "error") => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: "success" | "error") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      
      {/* Toast Portal Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between p-3 rounded-lg border shadow-sm transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${
              t.type === "success"
                ? "bg-white border-emerald-200 text-slate-800"
                : "bg-white border-red-200 text-slate-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {t.type === "success" ? (
                <CheckCircle2Icon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              ) : (
                <AlertCircleIcon className="w-4 h-4 text-red-500 flex-shrink-0" />
              )}
              <span className="text-xs font-medium">{t.message}</span>
            </div>
            
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <XIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
