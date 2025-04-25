/* eslint-disable no-restricted-imports */
import { URL } from 'url';

const createProxyConfig = (env, baseUrl) => (proxy) => {
  proxy.on('proxyReq', async (proxyReq, req, res) => {
    const url = new URL(baseUrl);
    const basePath = url.pathname;
    const baseUrlWithoutPath = url.origin;
    const parsedUrl = new URL(basePath + req.url.replace(/^\//, ''), baseUrlWithoutPath);
  });
};

/**
 * @param { ReturnType<getEnvVariables> } env
 * @returns { import('vite').ServerOptions }
 */
export const devServerSettings = (env) => {
  const url = new URL(env.BASE_URL);
  return {
    port: url.port,
    https: url.protocol === 'https:',
    proxy: {
      '/api': {
        target: env.VUE_APP_SERVICE_URL_PROXY,
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/api/, ''),
        configure: createProxyConfig(env, env.VUE_APP_SERVICE_URL_PROXY),
      },
    },
    fs: {
      allow: [
        // Allow serving files from one level up to the project root, in order to show lx fonts in serving mode
        '..',
        // Allow serving files from two levels up to the project root, in order to show lx fonts in serving mode when lx lib is referenced in the project
        '../..',
      ],
    },
  };
};
