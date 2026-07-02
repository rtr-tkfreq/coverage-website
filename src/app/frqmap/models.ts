/** Type definitions for the PostgREST coverage API behind `/api`. */

/** A selectable map layer: a real operator (code matches
 *  cov_mno.operator/tileurl.operator directly, e.g. 'TMA') or a combined/
 *  derived layer (e.g. '@all') — always the same shape either way. */
export interface Layer {
  code: string;
  reference: string | null;
  visible_name: string;
  is_default: boolean;
  sort_order: number;
}

export interface LayerObligation {
  layer: string;
  type: string;
  source: string[];
}

/** Response of `/api/tileurl` — the coverage tile layer for an operator. */
export interface LayerConfiguration {
  operator: string;
  reference: string | null;
  date: string;
  url: string;
}

/** Coverage details for a clicked point, from `/api/rpc/cov`. */
export interface PointInfoCoverage {
  operator: string;
  reference: string;
  license: string;
  raster: string;
  last_updated: string;
  technology: string | null;
  downloadkbitmax: number;
  downloadkbitnormal: number;
  uploadkbitmax: number;
  uploadkbitnormal: number;
  centroid_x: number;
  centroid_y: number;
  /** GeoJSON (EPSG:4326) of the 100 m raster cell. */
  geojson: string;
}

/** Administrative / geographic identifiers for a clicked point, from `/api/rpc/id`. */
export interface PointInfoIds {
  vgd_kg_nr: string;
  vgd_kg: string; // Katastralgemeinde
  vgd_gkz: string;
  vgd_pg: string; // Gemeinde
  vgd_gb_kz: string;
  vgd_gb: string; // Bezirk
  vgd_bl_kz: string;
  vgd_bl: string; // Bundesland
  rtr_j6_name: string; // Dauersiedlungsraum
  rtr_j6_id: string;
  r100: string;
  long_id100: string;
  short_id100: string;
  r250: string;
  long_id250: string;
  short_id250: string;
  rtr_j1_kg: string;
  rtr_j1_kg_nr: string;
  location_tooltip: string;
  kg_operator: string;
  kg_deadline: string;
  request_latitude: number;
  request_longitude: number;
}
