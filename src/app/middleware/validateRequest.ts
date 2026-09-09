import { NextFunction, Request, Response } from 'express';
import { AnyZodObject } from 'zod';
import catchAsync from '../utils/catchAsync';

const validateRequest = (schema: AnyZodObject) => {
    return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const parsed = await schema.parseAsync({
            body: req.body,
            cookies: req.cookies,
        });

        // Hand the handler what the schema made, not what the client sent:
        // every `.transform()` in a schema — trimming, coercing a date, adding
        // a missing `https://` — is otherwise computed and thrown away. Merged
        // rather than assigned so a schema that does not describe every field
        // cannot silently drop the rest of the body.
        const body = (parsed as { body?: Record<string, unknown> })?.body;
        if (body && typeof body === 'object') {
            req.body = { ...req.body, ...body };
        }

        next();
    });
};

export default validateRequest;
