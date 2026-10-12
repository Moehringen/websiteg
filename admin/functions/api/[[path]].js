import { handleApiRequest } from '../../src/api.js';

export const onRequest = context => handleApiRequest(context.request, context.env);
