import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
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
import {
  FormOptionResponse,
  LayerConfiguration,
  Operator,
  PointInfoCoverage,
  PointInfoIds,
} from './models';

const API_BASE = '/api';
const TILES_BASE = '';
const BASEMAP_CAPABILITIES_URL = 'assets/WMTSCapabilities.xml';
const ATTRIBUTION =
  'Grundkarte &copy; <a href="//www.basemap.at/">basemap.at</a>, Versorgungsdaten CC-BY4.0.';

/** Austria-wide extent (EPSG:3857) used as the initial view. */
const AUSTRIA_EXTENT: Extent = [908071, 5751733, 2047289, 6375459];
const OVERLAY_MIN_ZOOM = 7;
const OVERLAY_MAX_ZOOM = 14;

/** Operator value representing "all operators". */
const ALL_OPERATORS = '@all';

const ACCEPT_JSON = { Accept: 'application/json' };
const ACCEPT_SINGLE_OBJECT = { Accept: 'application/vnd.pgrst.object+json' };

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
  formOptions?: FormOptionResponse;
  selectedOperator = ALL_OPERATORS;
  selectedObligationLayer: string | null = null;
  pointInfoCov: PointInfoCoverage[] | null = null;
  pointInfoIds: PointInfoIds[] | null = null;

  private map!: Map;
  private selectedReference: string | null = null;
  private coverageOverlay?: TileLayer<TileSource>;
  private obligationOverlays: TileLayer<TileSource>[] = [];
  private cellLayer: VectorLayer<VectorSource> | null = null;
  private clickMarkerLayer: VectorLayer<VectorSource> | null = null;
  private readonly capabilitiesParser = new WMTSCapabilities();

  constructor(private readonly http: HttpClient) {}

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

  /** Fits the Austria-wide extent to the current map size. */
  private fitAustria(): void {
    this.map.getView().fit(AUSTRIA_EXTENT, { size: this.map.getSize() });
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
      .get<FormOptionResponse>(`${API_BASE}/settings`, { headers: ACCEPT_SINGLE_OBJECT })
      .subscribe((response) => {
        this.formOptions = response;
        const fallback = response.filter.operators.find((operator) => operator.default);
        this.selectedOperator = fallback?.operator ?? ALL_OPERATORS;
        this.reloadMap();
      });
  }

  operatorFilterForOperator(operator: string): Operator | undefined {
    return this.formOptions?.filter.operators.find(
      (candidate) => (candidate.operator ?? ALL_OPERATORS) === operator,
    );
  }

  getOperatorByLabel(operator: string): Operator | undefined {
    return this.formOptions?.filter.operators.find((candidate) => candidate.operator === operator);
  }

  // --- coverage + obligation overlays --------------------------------------

  reloadMap(): void {
    const operator = this.selectedOperator;
    this.http
      .get<LayerConfiguration>(`${API_BASE}/tileurl?and=(operator.eq.${operator})&limit=1`, {
        headers: ACCEPT_SINGLE_OBJECT,
      })
      .subscribe((config) => {
        this.selectedReference = config.reference ?? null;
        this.setCoverageOverlay(config.url);
      });

    this.setObligationOverlays(this.currentObligationSources());
  }

  private currentObligationSources(): string[] | null {
    if (!this.selectedObligationLayer) {
      return null;
    }
    return (
      this.operatorFilterForOperator(this.selectedOperator)
        ?.obligations?.find((obligation) => obligation.type === this.selectedObligationLayer)
        ?.source ?? null
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
    const params: Record<string, string> = {
      cov_longitude: String(longitude),
      cov_latitude: String(latitude),
    };
    if (this.selectedOperator !== ALL_OPERATORS) {
      params['cov_operator'] = this.selectedOperator;
    }
    if (this.selectedReference) {
      params['cov_reference'] = this.selectedReference;
    }

    const query = new URLSearchParams(params).toString();
    this.http
      .get<PointInfoCoverage[]>(`${API_BASE}/rpc/cov?${query}`, { headers: ACCEPT_JSON })
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
   *  text, and the current selection (pin + cell highlight) is cleared. */
  closeDetails(): void {
    this.pointInfoCov = null;
    this.pointInfoIds = null;
    this.showCell(null);
    this.clearClickMarker();
    this.scheduleMapResize();
  }

  private clearClickMarker(): void {
    if (this.clickMarkerLayer) {
      this.map.removeLayer(this.clickMarkerLayer);
      this.clickMarkerLayer = null;
    }
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
