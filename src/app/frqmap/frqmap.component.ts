import { ChangeDetectionStrategy, Component, Inject, LOCALE_ID, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Feature, Map, View } from 'ol';
import { Coordinate } from 'ol/coordinate';
import { defaults as defaultControls } from 'ol/control';
import { Extent } from 'ol/extent';
import { GeoJSON } from 'ol/format';
import WMTSCapabilities from 'ol/format/WMTSCapabilities';
import { Point } from 'ol/geom';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { get as getProjection, transform } from 'ol/proj';
import { XYZ } from 'ol/source';
import TileSource from 'ol/source/Tile';
import VectorSource from 'ol/source/Vector';
import WMTS, { optionsFromCapabilities } from 'ol/source/WMTS';
import { Fill, Icon, Stroke, Style } from 'ol/style';

import { CenterOnUserLocationControl } from './center-on-user-location.control';
import { Layer, LayerConfiguration, LayerObligation, PointInfoCoverage, PointInfoIds } from './models';

const API_BASE = '/api';
const TILES_BASE = '';
const BASEMAP_CAPABILITIES_URL = 'assets/WMTSCapabilities.xml';
const ATTRIBUTION =
  'Grundkarte &copy; <a href="//www.basemap.at/">basemap.at</a>, Versorgungsdaten CC-BY4.0.';

/** Austria-wide extent (EPSG:3857) used as the initial view. */
const AUSTRIA_EXTENT: Extent = [908071, 5751733, 2047289, 6375459];

/** Min viewport width (UIkit `@m`) treated as desktop. */
const DESKTOP_BREAKPOINT = 960;
/** On desktop the initial view starts 20% more zoomed in than the full-country fit. */
const DESKTOP_INITIAL_ZOOM_FACTOR = 1.2;
const OVERLAY_MIN_ZOOM = 7;
const OVERLAY_MAX_ZOOM = 14;

/** Layer code representing "all operators". */
const ALL_OPERATORS = '@all';

const ACCEPT_JSON = { Accept: 'application/json' };

const CELL_STYLE = new Style({
  fill: new Fill({ color: 'rgba(255,100,50,0.5)' }),
  stroke: new Stroke({ color: 'rgba(80,80,80,0.5)', width: 2 }),
});

/** Teardrop pin marking the clicked location. Inlined so it is self-contained. */
const CLICK_MARKER_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="36" viewBox="0 0 24 36">' +
  '<path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24C24 5.37 18.63 0 12 0z"' +
  ' fill="#d32f2f" stroke="#fff" stroke-width="2"/>' +
  '<circle cx="12" cy="12" r="4.5" fill="#fff"/>' +
  '</svg>';

/** A fixed-pixel-size pin, so the clicked spot stays visible at every zoom level
 *  (unlike the geographic 100 m cell square, which shrinks to nothing when zoomed out). */
const CLICK_MARKER_STYLE = new Style({
  image: new Icon({
    src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(CLICK_MARKER_SVG),
    anchor: [0.5, 1],
    scale: 0.5,
  }),
});

/** Keep the pin above all tile/vector layers, including the cell highlight. */
const CLICK_MARKER_Z_INDEX = 1000;

@Component({
  standalone: false,
  selector: 'app-frqmap',
  templateUrl: './frqmap.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./frqmap.component.scss'],
})
export class FrqmapComponent implements OnInit {
  layers: Layer[] = [];
  obligations: LayerObligation[] = [];
  selectedOperator = ALL_OPERATORS;
  selectedObligationLayer: string | null = null;
  pointInfoCov: PointInfoCoverage[] | null = null;
  pointInfoIds: PointInfoIds[] | null = null;

  private map!: Map;
  private coverageOverlay?: TileLayer<TileSource>;
  private obligationOverlays: TileLayer<TileSource>[] = [];
  private cellLayer: VectorLayer<VectorSource> | null = null;
  private clickMarkerLayer: VectorLayer<VectorSource> | null = null;
  private readonly capabilitiesParser = new WMTSCapabilities();

  constructor(
    private readonly http: HttpClient,
    @Inject(LOCALE_ID) private readonly locale: string,
  ) {}

  ngOnInit(): void {
    this.loadOptions();
    this.initMap();
  }

  // --- map setup -----------------------------------------------------------

  private initMap(): void {
    this.map = new Map({
      target: 'map',
      controls: defaultControls().extend([new CenterOnUserLocationControl()]),
      view: new View({ center: [0, 0], zoom: 10, enableRotation: false }),
      layers: [],
      pixelRatio: 1,
    });
    this.fitAustria();

    this.loadBasemap();

    this.map.on('click', (event) => {
      this.showClickMarker(event.coordinate);
      const [longitude, latitude] = transform(event.coordinate, 'EPSG:3857', 'EPSG:4326');
      this.loadInformationForPoint(longitude, latitude);
    });

    // The container is often still laying out right after creation, so the first
    // fit used a stale size; re-fit once it has its real size so Austria fills
    // the map instead of sitting in a band of empty space.
    for (const delay of [100, 300, 1000]) {
      setTimeout(() => {
        this.map.updateSize();
        this.fitAustria();
      }, delay);
    }
  }

  /** Fits the Austria-wide extent to the current map size. On desktop the view
   *  then zooms in 20% so it starts a bit closer than the full-country overview. */
  private fitAustria(): void {
    const view = this.map.getView();
    view.fit(AUSTRIA_EXTENT, { size: this.map.getSize() });
    if (window.innerWidth >= DESKTOP_BREAKPOINT) {
      const resolution = view.getResolution();
      if (resolution) {
        view.setResolution(resolution / DESKTOP_INITIAL_ZOOM_FACTOR);
      }
    }
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
        if (!options) {
          return;
        }
        options.attributions = ATTRIBUTION;
        const basemap = new TileLayer({ source: new WMTS(options) });
        this.desaturate(basemap);
        this.map.getLayers().insertAt(0, basemap);
      });
  }

  /** Renders a layer in grey tones only (the basemap.at "grau" tiles still carry
   *  muted colours); the coverage overlays keep their colours. */
  private desaturate(layer: TileLayer<TileSource>): void {
    layer.on('prerender', (event) => {
      const context = event.context as CanvasRenderingContext2D | undefined;
      if (context) {
        context.filter = 'grayscale(100%)';
      }
    });
    layer.on('postrender', (event) => {
      const context = event.context as CanvasRenderingContext2D | undefined;
      if (context) {
        context.filter = 'none';
      }
    });
  }

  // --- options + operator selection ----------------------------------------

  private loadOptions(): void {
    this.http
      .get<Layer[]>(`${API_BASE}/layers?order=sort_order.asc`, { headers: ACCEPT_JSON })
      .subscribe((layers) => {
        this.layers = layers;
        const fallback = layers.find((layer) => layer.is_default);
        this.selectedOperator = fallback?.code ?? ALL_OPERATORS;
        this.reloadMap();
      });
    this.http
      .get<LayerObligation[]>(`${API_BASE}/layer_obligations`, { headers: ACCEPT_JSON })
      .subscribe((obligations) => {
        this.obligations = obligations;
      });
  }

  operatorFilterForOperator(operator: string): Layer | undefined {
    return this.layers.find((candidate) => candidate.code === operator);
  }

  getOperatorByLabel(operator: string): Layer | undefined {
    return this.layers.find((candidate) => candidate.code === operator);
  }

  obligationTypesForSelectedOperator(): LayerObligation[] {
    return this.obligations.filter((obligation) => obligation.layer === this.selectedOperator);
  }

  /** This build's locale (`de`/`en`) picks which backend-provided label to
   *  show — this app is compiled once per locale (see angular.json), so
   *  LOCALE_ID is fixed for the lifetime of a given deployment, not
   *  something that changes at runtime. */
  obligationLabel(obligation: LayerObligation): string {
    return this.locale.startsWith('de') ? obligation.label_de : obligation.label_en;
  }

  // --- coverage + obligation overlays --------------------------------------

  reloadMap(): void {
    // api.layer_tileurl resolves the selected layer's tiles whether it has
    // its own render (a leaf, or a genuine multi-operator combo like
    // "all3600mhz") or is a pure alias for a single other layer's data (e.g.
    // a second reference of an operator that already has one) — a plain
    // `tileurl?operator=eq.<code>` filter only ever worked for the first
    // case, since a pure alias has no tileurl row under its own code at all.
    this.http
      .get<LayerConfiguration[]>(`${API_BASE}/rpc/layer_tileurl?cov_layer=${this.selectedOperator}`, {
        headers: ACCEPT_JSON,
      })
      .subscribe((configs) => {
        if (configs.length) {
          this.setCoverageOverlay(configs[0].url);
        }
      });

    this.setObligationOverlays(this.currentObligationSources());
  }

  private currentObligationSources(): string[] | null {
    if (!this.selectedObligationLayer) {
      return null;
    }
    return (
      this.obligations.find(
        (obligation) =>
          obligation.layer === this.selectedOperator && obligation.type === this.selectedObligationLayer,
      )?.source ?? null
    );
  }

  private setCoverageOverlay(url: string): void {
    if (this.coverageOverlay) {
      this.map.removeLayer(this.coverageOverlay);
    }
    this.coverageOverlay = this.tileOverlay(url);
    this.map.addLayer(this.coverageOverlay);
  }

  private setObligationOverlays(urls: string[] | null): void {
    for (const layer of this.obligationOverlays) {
      this.map.removeLayer(layer);
    }
    this.obligationOverlays = (urls ?? []).map((url) => {
      const layer = this.tileOverlay(url);
      this.map.addLayer(layer);
      return layer;
    });
  }

  private tileOverlay(url: string): TileLayer<TileSource> {
    return new TileLayer({
      source: new XYZ({
        url: `${TILES_BASE}${url}/{z}/{x}/{y}.png`,
        projection: getProjection('EPSG:3857')!,
        minZoom: OVERLAY_MIN_ZOOM,
        maxZoom: OVERLAY_MAX_ZOOM,
      }),
    });
  }

  // --- point info ----------------------------------------------------------

  private loadInformationForPoint(longitude: number, latitude: number): void {
    this.loadCoverageForPoint(longitude, latitude);
    this.loadIdsForPoint(longitude, latitude);
  }

  private loadCoverageForPoint(longitude: number, latitude: number): void {
    // api.cov_layer resolves the selected layer (leaf or combined) to its
    // underlying (operator, reference) set via cov_layer_source itself, so
    // the same call works for "@all", a single operator, or a combined
    // layer like the F7/16 combo — no separate reference tracking needed.
    const query = new URLSearchParams({
      cov_longitude: String(longitude),
      cov_latitude: String(latitude),
      cov_layer: this.selectedOperator,
    }).toString();
    this.http
      .get<PointInfoCoverage[]>(`${API_BASE}/rpc/cov_layer?${query}`, { headers: ACCEPT_JSON })
      .subscribe((coverage) => {
        this.pointInfoCov = coverage.length ? coverage : null;
        this.showCell(coverage.length ? coverage[0].geojson : null);
        this.scheduleMapResize();
      });
  }

  private loadIdsForPoint(longitude: number, latitude: number): void {
    const query = new URLSearchParams({
      cov_longitude: String(longitude),
      cov_latitude: String(latitude),
    }).toString();
    this.http
      .get<PointInfoIds[]>(`${API_BASE}/rpc/id?${query}`, { headers: ACCEPT_JSON })
      .subscribe((ids) => {
        if (ids.length) {
          // The coordinates aren't returned by the API, so carry them over.
          ids[0].request_longitude = longitude;
          ids[0].request_latitude = latitude;
          this.pointInfoIds = ids;
        } else {
          this.pointInfoIds = null;
        }
        this.scheduleMapResize();
      });
  }

  /** Closes the info panel: the right column animates back to 1/5 with the intro
   *  text. The pin stays so the user can still see where they clicked. */
  closeDetails(): void {
    this.pointInfoCov = null;
    this.pointInfoIds = null;
    this.showCell(null);
    this.scheduleMapResize();
  }

  /** Keeps the OpenLayers canvas in sync with the panel's width animation. */
  private scheduleMapResize(): void {
    for (const delay of [0, 100, 200, 300, 400, 500]) {
      setTimeout(() => this.map.updateSize(), delay);
    }
  }

  /** Highlights the clicked 100 m raster cell from its GeoJSON (or clears it). */
  private showCell(geojson: string | null): void {
    if (this.cellLayer) {
      this.map.removeLayer(this.cellLayer);
      this.cellLayer = null;
    }
    if (!geojson) {
      return;
    }
    const feature = new GeoJSON().readFeature(geojson, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857',
    }) as Feature;
    this.cellLayer = new VectorLayer({
      source: new VectorSource({ features: [feature] }),
      style: CELL_STYLE,
    });
    this.map.addLayer(this.cellLayer);
    this.map.updateSize();
  }

  /** Drops a pin at the clicked coordinate (EPSG:3857) so the location stays
   *  visible regardless of zoom; replaces any previous pin. */
  private showClickMarker(coordinate: Coordinate): void {
    if (this.clickMarkerLayer) {
      this.map.removeLayer(this.clickMarkerLayer);
    }
    this.clickMarkerLayer = new VectorLayer({
      source: new VectorSource({ features: [new Feature(new Point(coordinate))] }),
      style: CLICK_MARKER_STYLE,
      zIndex: CLICK_MARKER_Z_INDEX,
    });
    this.map.addLayer(this.clickMarkerLayer);
  }

  /** Formats decimal degrees as degrees/minutes/seconds, e.g. `48° 12' 30.5"`. */
  convertDMS(decimalDegrees: number): string {
    const degrees = decimalDegrees | 0;
    const fraction = Math.abs(decimalDegrees - degrees);
    const minutes = (fraction * 60) | 0;
    const seconds = (((fraction * 3600 - minutes * 60) * 1000) | 0) / 1000;
    return `${degrees}° ${minutes}' ${seconds}"`;
  }
}
