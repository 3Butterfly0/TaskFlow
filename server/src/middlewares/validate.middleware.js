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
        const errorMessages = error.errors.map((err) => `${err.path[err.path.length - 1]}: ${err.message}`);
        if (process.env.NODE_ENV === 'test') {
            console.error('Validation Error:', errorMessages);
        }
        next(new ApiError(400, `Validation failed: ${errorMessages.join(', ')}`));
    }
};