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
}

export interface LayerConfiguration {
  operator: string,
  reference: string,
  date: string,
  url: string

  [key: string]: any
}

export interface PointInformation {
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

