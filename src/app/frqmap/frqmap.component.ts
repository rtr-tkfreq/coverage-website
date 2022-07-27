import {Component, OnInit} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import sampleResponseToReq1, {FormOptionResponse, LayerConfiguration, Operator, PointInformation} from './sample1';

import Map from "ol/Map";
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import WMTSSource, {optionsFromCapabilities} from 'ol/source/WMTS'
import * as olProj from "ol/proj";
import {Extent} from "ol/extent";
import {HttpClient} from "@angular/common/http";
import {XYZ} from "ol/source";
import {Coordinate} from "ol/coordinate";
import VectorSource from "ol/source/Vector";
import {GeoJSON} from "ol/format";
import VectorLayer from "ol/layer/Vector";
import WMTSCapabilities from 'ol/format/WMTSCapabilities';
import {Fill, Stroke, Style} from "ol/style";
import TileSource from "ol/source/Tile";
import {Control, defaults as defaultControls} from "ol/control";


const baseUrl : String = "";
const baseUrlApi : String = `${baseUrl}/api`;
const baseUrlTiles : String = `${baseUrl}`;
const baseMapCapabilities: string = "https://basemap.at/wmts/1.0.0/WMTSCapabilities.xml";
const parser = new WMTSCapabilities();

@Component({
  selector: 'app-frqmap',
  templateUrl: './frqmap.component.html',
  styleUrls: ['./frqmap.component.scss']
})
export class FrqmapComponent implements OnInit {
  formOptions : FormOptionResponse;
  map: Map;
  currentVectorLayer: VectorLayer<VectorSource<any>> | null = null
  selectedOperator: String;
  selectedObligationLayer: string | null = null;
  selectedReference: String | null;
  currentOverlay : TileLayer<TileSource>
  currentObligationOverlays: Array<TileLayer<TileSource>>
  pointInfo: PointInformation[] | null


  constructor(
    private http : HttpClient
  ) { }

  ngOnInit(): void {
    console.log("init")
    //@TODO: Request input for options
    this.loadOptions()
    this.initMap()
  }

  private initMap(): void {
    this.map = new Map({
      controls: defaultControls().extend([new CenterOnUserLocationControl()]),
      view: new View({
        center: [0, 0],
        zoom: 10,
        enableRotation: false
      }),
      layers: [],
      target: 'map',
      pixelRatio: 1

    });

    var textent : Extent = [908071,  5751733,     2047289,       6375459];
    this.map.getView().fit(textent, {size: this.map.getSize()});

    //add basemap layers
    this.http.get(baseMapCapabilities, {
      observe: 'body',
      responseType: 'text'
    })
      .subscribe((text) => {
        const result = parser.read(text);
        const options = optionsFromCapabilities(result, {
          layer: 'bmapgrau',
          matrixSet: 'google3857'
        })
        options.attributions = 'Grundkarte &copy; <a href="//www.basemap.at/">' +
          'basemap.at</a>, Versorgungsdaten CC-BY4.0.'

        const layer = new TileLayer({
          source: new WMTSSource(options),
          opacity: 1,
          visible: true
        })
        this.map.getLayers().insertAt(0, layer)
        //this.map.addLayer(layer);
      });



    this.map.on('click', (e) => {
      let coordsWgs84 = olProj.transform(e.coordinate,'EPSG:3857', 'EPSG:4326');
      console.log(e.coordinate, coordsWgs84);
      this.loadInformationForPoint(coordsWgs84)
    })

    let timeouts = [100, 300, 1000, 3000]
    timeouts.forEach(to => {
      setTimeout(() => {
        this.map.updateSize();
      }, to);
    })
  }

  private loadOptions() {
//    this.formOptions = sampleResponseToReq1;
    let url = `${baseUrlApi}/settings`;
    this.http.get<FormOptionResponse>(url,
      {
        headers: {
          "Accept": "application/vnd.pgrst.object+json"
        }})
      .subscribe((response) => {
        this.formOptions = response;

        //there should be a default - select it
        let defaultOperator = this.formOptions.filter.operators.find(o => {
          return o.default
        })
        if (defaultOperator?.operator === null) {
          defaultOperator.operator = "default"
        }
        if (defaultOperator) {
          this.selectedOperator = defaultOperator.operator;
          this.reloadMap()
        }
      })

  }

  reloadMap() : void {
    const reference = null;  // e.g. "F1/16" or "F7/16"
    let operator = this.selectedOperator;
    if (operator === null || operator === "null" || operator === "default") {
      operator = "@all"
    }

    let url = '';

    if (reference) {
      url = `${baseUrlApi}/tileurl?and=(operator.eq.${operator},reference.eq.${reference})&limit=1`
    }
    else {
      url = `${baseUrlApi}/tileurl?and=(operator.eq.${operator})&limit=1`
    }

    console.log(this.selectedOperator);

    this.http.get<LayerConfiguration>(url, {
      headers: {
        "Accept": "application/vnd.pgrst.object+json"
      }
    })
      .subscribe((val) => {
        console.log(val.url)
        if (val.reference) {
          this.selectedReference = val.reference;
        } else {
          this.selectedReference = null;
        }
        this.changeOverlaySource(val.url);
      });

    //for debug only
    if (this.selectedObligationLayer) {
      let obligationUrl = '';
      if (reference) {
        obligationUrl = `${baseUrlApi}/tileurl?and=(operator.eq.${operator},reference.eq.${reference})&obligation=${this.selectedObligationLayer}`
      } else {
        obligationUrl = `${baseUrlApi}/tileurl?and=(operator.eq.${operator})&obligation=${this.selectedObligationLayer}`
      }

      console.log(this.selectedOperator);

      this.http.get<any>(obligationUrl, {
        headers: {
          "Accept": "application/json"
        }
      })
        .subscribe((val) => {
          console.log(val)
        });
    }

    //reload in any case
    if (this.selectedObligationLayer && this.operatorFilterForOperator(this.selectedOperator)) {
      let urls = this.operatorFilterForOperator(this.selectedOperator)?.obligations?.find(o => o.type === this.selectedObligationLayer)?.source;
      if (urls) {
        this.changeObligationSource(urls);
      } else {
        this.changeObligationSource(null);
      }
    } else {
      this.changeObligationSource(null);
    }
  }

  operatorFilterForOperator(operator: String): Operator | null {
    if (this.formOptions && this.formOptions.filter && this.formOptions.filter.operators) {
      let matchingOperator = this.formOptions.filter.operators.find(o =>
        o.operator === operator
      )
      return matchingOperator || null;
    } else {
      return null;
    }
  }

  private loadInformationForPoint(coords : Coordinate) : void {
    let params : any = {
      cov_longitude: coords[0],
      cov_latitude: coords[1]
    }
    if (this.selectedOperator === null || this.selectedOperator === "null" || this.selectedOperator === "default") {
      //nothing
      //params.cov_operator = "@all";
    }
    else {
      params.cov_operator = this.selectedOperator;
    }

    //Same for reference (f1/16), if any
    if (this.selectedReference) {
      params.cov_reference = this.selectedReference;
    }

    let searchParams = (new URLSearchParams(params).toString());
    let url = `${baseUrlApi}/rpc/cov?${searchParams}`;

    this.http.get<PointInformation[]>(url, {
      headers: {
        "Accept": "application/json"
      }
    })
      .subscribe((val) => {
        if (val.length > 0) {
          this.pointInfo = val

          let first = val[0];

          //set coordinates from request in order to
          //not need the server return it
          val[0].request_latitude = params.cov_latitude;
          val[0].request_longitude = params.cov_longitude;

          if (this.currentVectorLayer !== null) {
            this.map.removeLayer(this.currentVectorLayer);
            this.currentVectorLayer = null;
          }

          let geojson = new GeoJSON().readFeature(first.geojson, {
            dataProjection: 'EPSG:4326', //WGS84
            featureProjection: 'EPSG:3857' //Overlay + Basemap
          });

          var vectorSource = new VectorSource({
            features: [geojson]
          });
          this.currentVectorLayer = new VectorLayer({
            source: vectorSource,
            style: new Style ({
                fill: new Fill({
                    color: 'rgba(255,100,50,0.5)'
                }),
               stroke: new Stroke({
                  color:'rgba(80,80,80,0.5)',
                 width: 2
               })

            })

          })
          this.map.addLayer(this.currentVectorLayer);
          this.map.updateSize();

        }
        else {
          this.pointInfo = null
          if (this.currentVectorLayer !== null) {
            this.map.removeLayer(this.currentVectorLayer);
            this.currentVectorLayer = null;
          }
          console.log("unset")
        }
      })


  }

  private changeOverlaySource(url: String) :void {
    if (this.currentOverlay != null) {
      this.map.removeLayer(this.currentOverlay)
    }

    const tileUrl = `${baseUrlTiles}${url}/{z}/{x}/{y}.png`;
    this.currentOverlay = new TileLayer({
      source: new XYZ({
          url: tileUrl,
          projection: olProj.get('EPSG:3857'),
          maxZoom: 14,
          minZoom: 7
        }
      ),
      visible: true,
      opacity: 1.0
    });

    this.map.addLayer(this.currentOverlay);
  }

  private changeObligationSource(urls: Array<string> | null) :void {
    //remove obligation layers
    if (this.currentObligationOverlays != null &&
      this.currentObligationOverlays.length > 0) {
      this.currentObligationOverlays.forEach(layer => {
          this.map.removeLayer(layer)
        }
      )
    }

    this.currentObligationOverlays = [];

    if (urls) {
      urls.forEach((url) => {
        const tileUrl = baseUrlTiles + `${url}/{z}/{x}/{y}.png`;
        let newOverlay = new TileLayer({
          source: new XYZ({
              url: tileUrl,
              projection: olProj.get('EPSG:3857'),
              maxZoom: 14,
              minZoom: 7
            }
          ),
          visible: true,
          opacity: 1.0
        });

        this.map.addLayer(newOverlay);
        this.currentObligationOverlays.push(newOverlay);

      })
    }

  }

  getOperatorByLabel(name : String): Operator | undefined {
    let result = this.formOptions.filter.operators.find((o) => {
      return o.operator === name
    });
    return result
  }

  convertDMS(dd: number): string {
    //https://stackoverflow.com/questions/5786025/decimal-degrees-to-degrees-minutes-and-seconds-in-javascript
    var deg = dd | 0; // truncate dd to get degrees
    var frac = Math.abs(dd - deg); // get fractional part
    var min = (frac * 60) | 0; // multiply fraction by 60 and truncate
    var sec = ((frac * 3600 - min * 60)*1000|0)/1000;
    return deg + "° " + min + "' " + sec + "\"";
  }
}

class CenterOnUserLocationControl extends Control {
  /**
   * @param {Object} [opt_options] Control options.
   */
  constructor(opt_options? : any) {
    const options = opt_options || {};

    var button = document.createElement('button');
    button.innerHTML = '<img alt="" src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDQuMjMzMyA0LjIzMzMiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtNTEuMDMxIC02NikiPgogIDxjaXJjbGUgY3g9IjUzLjE0OCIgY3k9IjY4LjExNyIgcj0iMS4wNTgzIiBmaWxsPSIjZmZmIiBzdHlsZT0icGFpbnQtb3JkZXI6ZmlsbCBtYXJrZXJzIHN0cm9rZSIvPgogPC9nPgo8L3N2Zz4K" />';

    const element = document.createElement('div');
    element.className = 'center-user-location ol-unselectable ol-control';

    element.appendChild(button);

    super({
      element: element,
      target: options.target,
    });

    button.addEventListener('click', this.centerMapOnUserLocation.bind(this), false);
    button.addEventListener('touchstart', this.centerMapOnUserLocation.bind(this), false);
  }

  centerMapOnUserLocation() {
    new Promise((resolve, reject) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((position) => {
            let coords = [position.coords.longitude, position.coords.latitude]
            resolve(coords)
          }, (error) => {
            reject(error)
          })
        } else {
          reject("Geolocation is not supported by this browser.")
        }
      }
    ).then((coords: any) => {
      console.log("Centering map to user location ", coords)
      let convertedCoords = olProj.transform(coords, 'EPSG:4326', 'EPSG:3857')
      this.getMap().getView().setCenter(convertedCoords)
      this.getMap().getView().setZoom(14);
    });
  }
}
