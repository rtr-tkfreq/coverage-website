import { Feature } from 'ol';
import { Control } from 'ol/control';
import { Point } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import { transform } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';

/** "Locate me" crosshair, inlined so the control is self-contained.
 *  Uses `currentColor` so it stays visible against the control button. */
const ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"' +
  ' style="display:block;margin:auto" aria-hidden="true"' +
  ' fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
  '<circle cx="12" cy="12" r="3"/>' +
  '<line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/>' +
  '<line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/>' +
  '</svg>';

/** Classic "you are here" dot: blue fill with a white outline. */
const USER_LOCATION_STYLE = new Style({
  image: new CircleStyle({
    radius: 7,
    fill: new Fill({ color: 'rgba(0,90,200,0.9)' }),
    stroke: new Stroke({ color: '#fff', width: 3 }),
  }),
});

/** OpenLayers control that recenters the map on the user's current GPS location. */
export class CenterOnUserLocationControl extends Control {
  private readonly markerSource = new VectorSource();
  private readonly markerLayer = new VectorLayer({
    source: this.markerSource,
    style: USER_LOCATION_STYLE,
  });

  constructor() {
    const button = document.createElement('button');
    button.type = 'button';
    button.title = $localize`:@@centerOnLocation:Auf aktuellen Standort zentrieren`;
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
        const map = this.getMap();
        const view = map?.getView();
        view?.setCenter(center);
        view?.setZoom(14);

        // Ensure the marker layer is on the map, then mark the location.
        if (map && !map.getLayers().getArray().includes(this.markerLayer)) {
          map.addLayer(this.markerLayer);
        }
        this.markerSource.clear();
        this.markerSource.addFeature(new Feature(new Point(center)));
      },
      (error) => console.warn('Could not determine user location', error),
    );
  }
}
