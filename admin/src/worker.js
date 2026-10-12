import { handleApiRequest } from './api.js';

export default {
  async fetch(request, env) {
    const response = await handleApiRequest(request, env);
    return response || env.ASSETS.fetch(request);
  }
};
