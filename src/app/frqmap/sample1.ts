import {Form} from "@angular/forms";

export interface FormOptionResponse {
  filter: Filter,

  [key: string]: any
}

export interface Filter {
  operators: Array<Operator>,

  [key: string]: any
}

export interface Operator {
  label: string,
  default: boolean,
  operator: string | null
  obligations?: Array<OperatorObligations>
}

export interface OperatorObligations {
  type: string,
  source: Array<string>,
}

export interface LayerConfiguration {
  operator: string,
  reference: string,
  date: string,
  url: string

  [key: string]: any
}

export interface PointInfoCoverage {
  operator: string,
  reference: string,
  license: string,
  raster: string,
  last_updated: Date,
  technology: string | null,
  downloadkbitmax: number,
  downloadkbitnormal: number,
  uploadkbitmax: number,
  uploadkbitnormal: number,
  centroid_x: number,
  centroid_y: number,
  geojson: string,
  [key: string]: any
}

export interface PointInfoIds {
  vgd_kg_nr: string, vgd_kg: string, //katastralgemeinde
  vgd_gkz: string ,vgd_pg: string, //gemeinde
  vgd_gb_kz: string, vgd_gb: string, //bezirk
  vgd_bl_kz: string, vgd_bl: string, //bundesland

  rtr_j6_name: string, rtr_j6_id: string, //DSR

  r100: string, //raster 100m
  long_id100: string,
  short_id100: string,

  r250: string, //raster 250m
  long_id250: string,
  short_id250: string,

  rtr_j1_kg: string, //J1 annex KG
  rtr_j1_kg_nr: string,
  location_tooltip: string,
  kg_operator: string,
  kg_deadline: string,
  request_latitude: number,
  request_longitude: number
  [key: string]: any
}

const sample: FormOptionResponse = {
  "object": "settings",
  "filter": {
    "bands": [
      {
        "name": "@all",
        "default": true,
        "reference": "F1/16"
      },
      {
        "name": "@3400mhz",
        "default": false,
        "reference": "F7/16"
      }
    ],
    "timeline": [
      {
        "date": "2021-01-01"
      },
      {
        "date": "2021-01-03"
      },
      {
        "date": "2021-03-05"
      },
      {
        "date": "2021-06-30"
      }
    ],
    "operators": [
      {
        "label": "@all",
        "default": true,
        "operator": null
      },
      {
        "label": "A1 Telekom Austria",
        "default": false,
        "operator": "A1TA"
      },
      {
        "label": "T-Mobile Austria",
        "default": false,
        "operator": "TMA"
      },
      {
        "label": "Hutchison Drei Austria",
        "default": false,
        "operator": "H3A"
      },
      {
        "label": "LIWEST Kabel Medien",
        "default": false,
        "operator": "LIWEST"
      },
      {
        "label": "Salzburg AG",
        "default": false,
        "operator": "SBAG"
      },
      {
        "label": "Mass Response",
        "default": false,
        "operator": "MASS"
      },
      {
        "label": "Graz Holding",
        "default": false,
        "operator": "GRAZH"
      }
    ]
  }
}

export default sample;

let demo: Operator;
demo = {
  "label": "@all",
  "default": true,
  "operator": null
};

