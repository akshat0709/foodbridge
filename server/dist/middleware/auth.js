import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config.js';
import { AppError } from './errorHandler.js';
/** Requires a valid Bearer token. Missing, malformed, expired or forged tokens get 401. */
export function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new AppError('Authentication required. Please log in.', 401, 'UNAUTHORIZED'));
    }
    const token = authHeader.slice('Bearer '.length).trim();
    let secret;
    try {
        secret = getJwtSecret();
    }
    catch (err) {
        return next(err);
    }
    try {
        const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
        if (!decoded?.userId || !decoded?.role) {
            return next(new AppError('Invalid authentication token.', 401, 'INVALID_TOKEN'));
        }
        req.user = decoded;
        next();
    }
    catch (err) {
        if (err.name === 'TokenExpiredError') {
            return next(new AppError('Your session has expired. Please log in again.', 401, 'TOKEN_EXPIRED'));
        }
        return next(new AppError('Invalid authentication token.', 401, 'INVALID_TOKEN'));
    }
}
export function authorize(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AppError('Unauthorized. No user identity.', 401, 'UNAUTHORIZED'));
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next(new AppError(`Forbidden: Role '${req.user.role}' is not authorized for this action. Allowed: ${allowedRoles.join(', ')}`, 403, 'FORBIDDEN'));
        }
        next();
    };
}
/**
 * Ownership check for mess/NGO-scoped resources: platform admins may act on any
 * organization; mess admins and NGO reps only on the organization linked to
 * their account. Throws 403 otherwise.
 */
export function assertOrgAccess(user, orgId) {
    if (!user) {
        throw new AppError('Unauthorized. No user identity.', 401, 'UNAUTHORIZED');
    }
    if (user.role === 'PLATFORM_ADMIN')
        return;
    if (!orgId || !user.organizationId || String(orgId) !== String(user.organizationId)) {
        throw new AppError('Forbidden: you can only access your own organization.', 403, 'FORBIDDEN');
    }
}
/** Middleware form of assertOrgAccess for routes with the organization id in :id. */
export function requireOrgAccessParam(param = 'id') {
    return (req, res, next) => {
        try {
            assertOrgAccess(req.user, req.params[param]);
            next();
        }
        catch (err) {
            next(err);
        }
    };
}
