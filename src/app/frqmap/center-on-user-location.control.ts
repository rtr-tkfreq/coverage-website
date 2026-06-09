import { Control } from 'ol/control';
import { transform } from 'ol/proj';

/** White dot icon, inlined so the control is self-contained. */
const ICON =
  '<img alt="" src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDQuMjMzMyA0LjIzMzMiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtNTEuMDMxIC02NikiPgogIDxjaXJjbGUgY3g9IjUzLjE0OCIgY3k9IjY4LjExNyIgcj0iMS4wNTgzIiBmaWxsPSIjZmZmIiBzdHlsZT0icGFpbnQtb3JkZXI6ZmlsbCBtYXJrZXJzIHN0cm9rZSIvPgogPC9nPgo8L3N2Zz4K" />';

/** OpenLayers control that recenters the map on the user's current GPS location. */
export class CenterOnUserLocationControl extends Control {
  constructor() {
    const button = document.createElement('button');
    button.type = 'button';
    button.innerHTML = ICON;

    const element = document.createElement('div');
    element.className = 'center-user-location ol-unselectable ol-control';
    element.appendChild(button);

    super({ element });

    button.addEventListener('click', () => this.centerOnUser());
    button.addEventListener('touchstart', () => this.centerOnUser());
  }

  private centerOnUser(): void {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const center = transform(
          [position.coords.longitude, position.coords.latitude],
          'EPSG:4326',
          'EPSG:3857',
        );
        const view = this.getMap()?.getView();
        view?.setCenter(center);
        view?.setZoom(14);
      },
      (error) => console.warn('Could not determine user location', error),
    );
  }
}
