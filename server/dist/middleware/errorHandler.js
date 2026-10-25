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
    let statusCode = err.statusCode || err.status || 500;
    // Only keep string codes from AppError; MongoDB driver errors carry numeric codes.
    let code = typeof err.code === 'string' ? err.code : 'INTERNAL_ERROR';
    let message = err.message || 'An unexpected error occurred';
    if (err.name === 'BSONError') {
        // new ObjectId(<malformed string>) inside analytics pipelines
        statusCode = 400;
        code = 'INVALID_ID';
        message = 'Invalid id in request';
    }
    else if (err.name === 'CastError') {
        // e.g. /api/messes/not-an-id -> invalid ObjectId
        statusCode = 400;
        code = 'INVALID_ID';
        message = `Invalid value for '${err.path}'`;
    }
    else if (err.name === 'ValidationError') {
        statusCode = 400;
        code = 'VALIDATION_ERROR';
    }
    else if (err.type === 'entity.parse.failed') {
        code = 'INVALID_JSON';
        message = 'Request body is not valid JSON';
    }
    else if (err.name === 'MongoServerError' || err.name === 'MongoNetworkError' || err.name === 'MongooseServerSelectionError') {
        code = 'DATABASE_ERROR';
    }
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
