# Coverage map

This website shows a map showing mobile coverage in Austria.

## Prerequisites

This project targets **Angular 22** and requires **Node.js 22 LTS** (or newer). If not installed, please install
[nodejs/npm](https://nodejs.org/en/) and the Angular CLI using `npm install -g @angular/cli`. All other dependencies
can be installed using `npm install`.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

The API/tile base URL is configured per environment in `src/environments/`. Local/development builds point at the live
host (`https://frq.rtr.at`) so the map and coverage data work when surfed locally (the backend sends permissive CORS
headers). Production builds use same-origin relative URLs (`/api` and root-relative tile paths).

## Build for deployment

Run `ng build` to build the project. With the Angular application builder the localized build artifacts are stored
under `dist/frq-map/browser/<locale>/` (i.e. `.../browser/de/` and `.../browser/en/`); serve each locale from its
sub-directory.  
The individual steps can also be found in the corresponding [GitHub action](https://github.com/rtr-tkfreq/coverage-website/blob/master/.github/workflows/main.yml). 
The up-to-date pages can be found in the `build` branch.

## Translation

Translation is done with [angular i18n](https://angular.io/guide/i18n-common-translation-files). The
locale files in `/locale` can be generated via `ng extract-i18n --output-path src/locale`

## License

Copyright 2022-2024 Rundfunk und Telekom Regulierungs-GmbH (RTR-GmbH). This source code is licensed under the Apache license found in the LICENSE.txt file. The documentation to the project is licensed under the CC BY 4.0 license.
Trademarks and logos of RTR, TKK and PCK are not part of this license.
