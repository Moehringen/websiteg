import { handleApiRequest } from '../../lib/api.js';

export const onRequest = context => handleApiRequest(context.request, context.env);
