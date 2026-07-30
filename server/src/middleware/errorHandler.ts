import { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error("Error encountered:", err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "An unexpected server error occurred";
  
  res.status(status).json({
    error: {
      message,
      status,
      details: err.errors || undefined,
    }
  });
}
