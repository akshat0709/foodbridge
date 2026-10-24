export class AppError extends Error {
    statusCode;
    code;
    details;
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}
export function errorHandler(err, req, res, next) {
    const statusCode = err.statusCode || 500;
    const code = err.code || 'INTERNAL_ERROR';
    const message = err.message || 'An unexpected error occurred';
    if (process.env.NODE_ENV !== 'test' && statusCode >= 500) {
        console.error(`[Error] ${req.method} ${req.path} - ${statusCode} ${code}:`, err);
    }
    const response = {
        success: false,
        error: {
            code,
            message,
            details: err.details || undefined,
            timestamp: new Date().toISOString(),
        },
    };
    res.status(statusCode).json(response);
}
