/**
 * Default (development / local) environment.
 *
 * Uses same-origin URLs; `ng serve` proxies `/api`, `/cov` and `/obligations`
 * to the live host `https://frq.rtr.at` (see proxy.conf.json). A proxy is used
 * (rather than absolute URLs) because the coverage tile server sends no CORS
 * headers and MapLibre needs CORS for its WebGL tile textures.
 */
export const environment = {
  production: false,
  apiBaseUrl: '/api',
  tilesBaseUrl: '',
};
