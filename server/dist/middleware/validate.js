import { ZodError } from 'zod';
import { AppError } from './errorHandler.js';
export function validate(schema, source = 'body') {
    return (req, res, next) => {
        try {
            const parsed = schema.parse(req[source]);
            req[source] = parsed;
            next();
        }
        catch (error) {
            if (error instanceof ZodError) {
                const issues = error.issues.map(i => ({
                    field: i.path.join('.'),
                    message: i.message,
                }));
                return next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', issues));
            }
            next(error);
        }
    };
}
