/**
 * Type definitions for the PostgREST coverage API behind `/api`.
 */

export interface FormOptionResponse {
  filter: Filter;
  [key: string]: unknown;
}

export interface Filter {
  operators: Operator[];
  [key: string]: unknown;
}

export interface Operator {
  label: string;
  default: boolean;
  /** `null` represents the "all operators" option. */
  operator: string | null;
  obligations?: OperatorObligation[];
}

export interface OperatorObligation {
  type: string;
  source: string[];
  [key: string]: unknown;
}

/** Response of `/api/tileurl` — the coverage tile layer for an operator/reference. */
export interface LayerConfiguration {
  operator: string;
  reference: string | null;
  date: string;
  url: string;
  [key: string]: unknown;
}

/** Coverage information for a clicked point, from `/api/rpc/cov`. */
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
  [key: string]: unknown;
}

/** Administrative / geographic identifiers for a clicked point, from `/api/rpc/id`. */
export interface PointInfoIds {
  vgd_kg_nr: string;
  vgd_kg: string;
  vgd_gkz: string;
  vgd_pg: string;
  vgd_gb_kz: string;
  vgd_gb: string;
  vgd_bl_kz: string;
  vgd_bl: string;
  rtr_j6_name: string;
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
  [key: string]: unknown;
}
