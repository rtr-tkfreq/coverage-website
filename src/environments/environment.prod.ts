/**
 * Production environment.
 *
 * The app is deployed on the same origin as the API and tile server, so both
 * use same-origin relative URLs.
 */
export const environment = {
  production: true,
  apiBaseUrl: '/api',
  tilesBaseUrl: '',
};
