/**
 * Default (development / local) environment.
 *
 * Points at the live host so the app shows real coverage data when surfed
 * locally (the backend sends permissive CORS headers). Replaced by
 * `environment.prod.ts` for production builds (see angular.json fileReplacements).
 */
export const environment = {
  production: false,
  apiBaseUrl: 'https://frq.rtr.at/api',
  tilesBaseUrl: 'https://frq.rtr.at',
};
