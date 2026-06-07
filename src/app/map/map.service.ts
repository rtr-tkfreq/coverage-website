import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { Feature, Map, View } from 'ol';
import { Control, defaults as defaultControls } from 'ol/control';
import { Extent } from 'ol/extent';
import { GeoJSON } from 'ol/format';
import WMTSCapabilities from 'ol/format/WMTSCapabilities';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat, get as getProjection, toLonLat } from 'ol/proj';
import { XYZ } from 'ol/source';
import VectorSource from 'ol/source/Vector';
import WMTS, { optionsFromCapabilities } from 'ol/source/WMTS';
import { Fill, Stroke, Style } from 'ol/style';

import { environment } from '../../environments/environment';

/** A click on the map, in WGS84 coordinates. */
export interface MapClick {
  longitude: number;
  latitude: number;
}

const BASEMAP_CAPABILITIES_URL = 'assets/WMTSCapabilities.xml';
const ATTRIBUTION =
  'Grundkarte &copy; <a href="//www.basemap.at/">basemap.at</a>, Versorgungsdaten CC-BY4.0.';
const AUSTRIA_EXTENT: Extent = [908071, 5751733, 2047289, 6375459];

const Z_BASEMAP = 0;
const Z_COVERAGE = 1;
const Z_OBLIGATION = 2;
const Z_POINT = 3;

const POINT_STYLE = new Style({
  fill: new Fill({ color: 'rgba(255,100,50,0.5)' }),
  stroke: new Stroke({ color: 'rgba(80,80,80,0.5)', width: 2 }),
});

/**
 * Owns the OpenLayers map for the coverage view and all layer manipulation.
 * Provided per map component instance.
 */
@Injectable()
export class MapService {
  private readonly http = inject(HttpClient);
  private readonly capabilitiesParser = new WMTSCapabilities();

  private map?: Map;
  private coverageLayer?: TileLayer<XYZ>;
  private obligationLayers: TileLayer<XYZ>[] = [];
  private pointLayer?: VectorLayer<VectorSource>;

  private readonly clickSubject = new Subject<MapClick>();
  readonly click$: Observable<MapClick> = this.clickSubject.asObservable();

  /** Creates the map on the given target element and loads the grey basemap. */
  init(target: string | HTMLElement): void {
    this.map = new Map({
      target,
      controls: defaultControls().extend([new CenterOnUserLocationControl()]),
      view: new View({ center: [0, 0], zoom: 10, enableRotation: false }),
      layers: [],
      pixelRatio: 1,
    });

    this.map.getView().fit(AUSTRIA_EXTENT, { size: this.map.getSize() });
    this.loadBasemap();

    this.map.on('click', (event) => {
      const [longitude, latitude] = toLonLat(event.coordinate);
      this.clickSubject.next({ longitude, latitude });
    });

    for (const delay of [100, 300, 1000]) {
      setTimeout(() => this.map?.updateSize(), delay);
    }
  }

  /** Shows the coverage tile overlay for the given relative URL (or clears it). */
  showCoverage(url: string | null): void {
    if (!this.map) {
      return;
    }
    if (this.coverageLayer) {
      this.map.removeLayer(this.coverageLayer);
      this.coverageLayer = undefined;
    }
    if (!url) {
      return;
    }
    this.coverageLayer = this.tileLayer(url, Z_COVERAGE);
    this.map.addLayer(this.coverageLayer);
  }

  /** Replaces the obligation tile overlays (or clears them when null). */
  setObligationOverlays(urls: string[] | null): void {
    if (!this.map) {
      return;
    }
    for (const layer of this.obligationLayers) {
      this.map.removeLayer(layer);
    }
    this.obligationLayers = (urls ?? []).map((url) => {
      const layer = this.tileLayer(url, Z_OBLIGATION);
      this.map!.addLayer(layer);
      return layer;
    });
  }

  /** Highlights the clicked 100 m raster cell from GeoJSON (or clears it). */
  showPointPolygon(geojson: string | object | null): void {
    if (!this.map) {
      return;
    }
    if (this.pointLayer) {
      this.map.removeLayer(this.pointLayer);
      this.pointLayer = undefined;
    }
    if (!geojson) {
      return;
    }
    const feature = new GeoJSON().readFeature(geojson, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857',
    }) as Feature;
    this.pointLayer = new VectorLayer({
      source: new VectorSource({ features: [feature] }),
      style: POINT_STYLE,
      zIndex: Z_POINT,
    });
    this.map.addLayer(this.pointLayer);
  }

  /** Tears down the map; call from the host component's destroy hook. */
  destroy(): void {
    this.map?.setTarget(undefined);
    this.map = undefined;
  }

  private tileLayer(url: string, zIndex: number): TileLayer<XYZ> {
    return new TileLayer({
      source: new XYZ({
        url: `${environment.tilesBaseUrl}${url}/{z}/{x}/{y}.png`,
        projection: getProjection('EPSG:3857')!,
        minZoom: 7,
        maxZoom: 14,
      }),
      zIndex,
    });
  }

  private loadBasemap(): void {
    this.http
      .get(BASEMAP_CAPABILITIES_URL, { observe: 'body', responseType: 'text' })
      .subscribe((xml) => {
        const capabilities = this.capabilitiesParser.read(xml);
        const options = optionsFromCapabilities(capabilities, {
          layer: 'bmapgrau',
          matrixSet: 'google3857',
        });
        if (!options || !this.map) {
          return;
        }
        options.attributions = ATTRIBUTION;
        this.map.getLayers().insertAt(
          0,
          new TileLayer({ source: new WMTS(options), zIndex: Z_BASEMAP }),
        );
      });
  }
}

/** Custom OpenLayers control that recenters the map on the user's GPS location. */
class CenterOnUserLocationControl extends Control {
  constructor() {
    const button = document.createElement('button');
    button.type = 'button';
    button.innerHTML =
      '<img alt="" src="assets/center-on-user-location.svg" style="width:16px;height:16px;" />';

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
        const center = fromLonLat([position.coords.longitude, position.coords.latitude]);
        const view = this.getMap()?.getView();
        view?.setCenter(center);
        view?.setZoom(14);
      },
      (error) => console.warn('Could not determine user location', error),
    );
  }
}
