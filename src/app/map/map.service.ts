import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import type { Feature } from 'geojson';
import maplibregl, { type LngLatBoundsLike, type StyleSpecification } from 'maplibre-gl';

import { environment } from '../../environments/environment';

/** A click on the map, in WGS84 coordinates. */
export interface MapClick {
  longitude: number;
  latitude: number;
}

/** basemap.at official MapLibre vector style (Web Mercator), CORS-enabled. */
const STYLE_URL = 'https://mapsneu.wien.gv.at/basemapv/bmapv/3857/resources/styles/root.json';
const ATTRIBUTION =
  'Grundkarte &copy; <a href="//www.basemap.at/" target="_blank" rel="noreferrer">basemap.at</a>, Versorgungsdaten CC-BY4.0.';
const AUSTRIA_BOUNDS: LngLatBoundsLike = [
  [9.4, 46.3],
  [17.2, 49.1],
];

const COVERAGE_SOURCE = 'coverage';
const COVERAGE_LAYER = 'coverage';
const OBLIGATION_PREFIX = 'obligation-';
const POINT_SOURCE = 'point';
const POINT_FILL = 'point-fill';
const POINT_LINE = 'point-line';

/**
 * Owns the MapLibre GL map for the coverage view and all source/layer
 * manipulation. Provided per map component instance. The public surface is the
 * same as the previous OpenLayers implementation, so the store/components are
 * unchanged.
 */
@Injectable()
export class MapService {
  private map?: maplibregl.Map;
  private ready = false;
  private obligationIds: string[] = [];

  // Latest desired overlay state, (re)applied whenever the style is ready.
  private desiredCoverage: string | null = null;
  private desiredObligations: string[] | null = null;
  private desiredPoint: string | object | null = null;

  private readonly clickSubject = new Subject<MapClick>();
  readonly click$: Observable<MapClick> = this.clickSubject.asObservable();

  init(target: string | HTMLElement): void {
    void this.createMap(target);
  }

  showCoverage(url: string | null): void {
    this.desiredCoverage = url;
    if (this.ready) {
      this.applyCoverage();
    }
  }

  setObligationOverlays(urls: string[] | null): void {
    this.desiredObligations = urls;
    if (this.ready) {
      this.applyObligations();
    }
  }

  showPointPolygon(geojson: string | object | null): void {
    this.desiredPoint = geojson;
    if (this.ready) {
      this.applyPoint();
    }
  }

  destroy(): void {
    this.map?.remove();
    this.map = undefined;
    this.ready = false;
  }

  private async createMap(target: string | HTMLElement): Promise<void> {
    let style: unknown = STYLE_URL;
    try {
      const json = (await (await fetch(STYLE_URL)).json()) as Record<string, any>;
      await this.resolveStyle(json);
      style = json;
    } catch (error) {
      console.error('Could not load basemap style', error);
    }

    const map = new maplibregl.Map({
      container: target,
      style: style as StyleSpecification,
      center: [13.3, 47.7],
      zoom: 6.3,
      attributionControl: false,
    });
    this.map = map;

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        showAccuracyCircle: false,
      }),
      'top-left',
    );
    map.addControl(new maplibregl.AttributionControl({ customAttribution: ATTRIBUTION }));

    map.fitBounds(AUSTRIA_BOUNDS, { padding: 20, animate: false });

    map.on('click', (event) =>
      this.clickSubject.next({ longitude: event.lngLat.lng, latitude: event.lngLat.lat }),
    );

    map.on('load', () => {
      this.ready = true;
      this.applyCoverage();
      this.applyObligations();
      this.applyPoint();
    });
  }

  private applyCoverage(): void {
    const map = this.map;
    if (!map) {
      return;
    }
    if (map.getLayer(COVERAGE_LAYER)) {
      map.removeLayer(COVERAGE_LAYER);
    }
    if (map.getSource(COVERAGE_SOURCE)) {
      map.removeSource(COVERAGE_SOURCE);
    }
    if (!this.desiredCoverage) {
      return;
    }
    map.addSource(COVERAGE_SOURCE, this.rasterSource(this.desiredCoverage));
    map.addLayer(
      { id: COVERAGE_LAYER, type: 'raster', source: COVERAGE_SOURCE },
      this.firstExistingLayer([...this.obligationIds, POINT_FILL]),
    );
  }

  private applyObligations(): void {
    const map = this.map;
    if (!map) {
      return;
    }
    for (const id of this.obligationIds) {
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    }
    this.obligationIds = [];
    (this.desiredObligations ?? []).forEach((url, index) => {
      const id = `${OBLIGATION_PREFIX}${index}`;
      map.addSource(id, this.rasterSource(url));
      map.addLayer({ id, type: 'raster', source: id }, this.firstExistingLayer([POINT_FILL]));
      this.obligationIds.push(id);
    });
  }

  private applyPoint(): void {
    const map = this.map;
    if (!map) {
      return;
    }
    for (const id of [POINT_FILL, POINT_LINE]) {
      if (map.getLayer(id)) map.removeLayer(id);
    }
    if (map.getSource(POINT_SOURCE)) {
      map.removeSource(POINT_SOURCE);
    }
    if (!this.desiredPoint) {
      return;
    }
    map.addSource(POINT_SOURCE, { type: 'geojson', data: this.toFeature(this.desiredPoint) });
    map.addLayer({
      id: POINT_FILL,
      type: 'fill',
      source: POINT_SOURCE,
      paint: { 'fill-color': 'rgba(255,100,50,0.5)' },
    });
    map.addLayer({
      id: POINT_LINE,
      type: 'line',
      source: POINT_SOURCE,
      paint: { 'line-color': 'rgba(80,80,80,0.5)', 'line-width': 2 },
    });
  }

  private rasterSource(url: string): maplibregl.RasterSourceSpecification {
    return {
      type: 'raster',
      tiles: [`${environment.tilesBaseUrl}${url}/{z}/{x}/{y}.png`],
      tileSize: 256,
      minzoom: 7,
      maxzoom: 14,
    };
  }

  /** Returns the first of the given layer ids that currently exists, for `beforeId`. */
  private firstExistingLayer(ids: string[]): string | undefined {
    return ids.find((id) => this.map?.getLayer(id));
  }

  /** Coerces a GeoJSON string/geometry/feature into a Feature for a geojson source. */
  private toFeature(geojson: string | object): Feature {
    const data: any = typeof geojson === 'string' ? JSON.parse(geojson) : geojson;
    if (data.type === 'Feature') {
      return data;
    }
    if (data.type === 'FeatureCollection') {
      return data.features[0];
    }
    return { type: 'Feature', geometry: data, properties: {} };
  }

  /**
   * Resolves the style's relative `sprite`/`glyphs` URLs to absolute, and inlines
   * each vector source's tiles as absolute URLs (fetching its TileJSON), because
   * MapLibre does not resolve relative URLs when a style is supplied as an object.
   */
  private async resolveStyle(style: Record<string, any>): Promise<void> {
    if (typeof style['sprite'] === 'string') {
      style['sprite'] = this.absolute(style['sprite'], STYLE_URL);
    }
    if (typeof style['glyphs'] === 'string') {
      style['glyphs'] = this.absolute(style['glyphs'], STYLE_URL);
    }
    const sources = Object.values<any>(style['sources'] ?? {});
    await Promise.all(sources.map((source) => this.resolveSource(source)));
  }

  private async resolveSource(source: Record<string, any>): Promise<void> {
    if (Array.isArray(source['tiles'])) {
      source['tiles'] = source['tiles'].map((tile: string) => this.absolute(tile, STYLE_URL));
      return;
    }
    if (typeof source['url'] !== 'string') {
      return;
    }
    const tileJsonUrl = this.absolute(source['url'], STYLE_URL);
    try {
      const tileJson = (await (await fetch(tileJsonUrl)).json()) as Record<string, any>;
      if (Array.isArray(tileJson['tiles'])) {
        source['tiles'] = tileJson['tiles'].map((tile: string) => this.absolute(tile, tileJsonUrl));
      }
      for (const key of ['minzoom', 'maxzoom', 'bounds', 'scheme', 'attribution']) {
        if (tileJson[key] !== undefined && source[key] === undefined) {
          source[key] = tileJson[key];
        }
      }
      delete source['url'];
    } catch {
      source['url'] = tileJsonUrl;
    }
  }

  /** Resolves a possibly-relative URL against a base, preserving `{...}` tokens. */
  private absolute(value: string, base: string): string {
    if (/^https?:\/\//.test(value)) {
      return value;
    }
    const braceIndex = value.indexOf('{');
    if (braceIndex === -1) {
      return new URL(value, base).href;
    }
    return new URL(value.slice(0, braceIndex), base).href + value.slice(braceIndex);
  }
}
