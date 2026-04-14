import ApiError from '../utils/ApiError.js';

export const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (error) {
        // map zod errors into array of messages
        const issues = error.issues || error.errors || [];
        const errorMessages = issues.length > 0 
            ? issues.map((err) => `${err.path[err.path.length - 1]}: ${err.message}`)
            : [error.message || 'Unknown validation error'];

        if (process.env.NODE_ENV === 'test') {
            console.error('Validation Error Details:', {
                message: error.message,
                issues: issues,
                stack: error.stack
            });
        }
        next(new ApiError(400, `Validation failed: ${errorMessages.join(', ')}`));
    }
};