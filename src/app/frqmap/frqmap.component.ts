import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import sampleResponseToReq1, {FormOptionResponse, LayerConfiguration, Operator, PointInformation} from './sample1';

import Map from "ol/Map";
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import TileGrid from "ol/tilegrid/TileGrid";
import WMTSGrid from "ol/tilegrid/WMTS";
import OSM from 'ol/source/OSM';
import WMTSSource, {optionsFromCapabilities} from 'ol/source/WMTS'
import * as olProj from "ol/proj";
import {Extent} from "ol/extent";
import {HttpClient} from "@angular/common/http";
import {XYZ} from "ol/source";
import {Coordinate} from "ol/coordinate";
import VectorSource from "ol/source/Vector";
import {Feature} from "ol";
import {GeoJSON} from "ol/format";
import VectorLayer from "ol/layer/Vector";
import WMTSCapabilities from 'ol/format/WMTSCapabilities';


const baseUrl : String = "https://frq.rtr.at/api"
const osmServer : String = "https://cache.netztest.at/tile/osm"
const baseMapCapabilities: string = "assets/WMTSCapabilities.xml";
const parser = new WMTSCapabilities();

@Component({
  selector: 'app-frqmap',
  templateUrl: './frqmap.component.html',
  styleUrls: ['./frqmap.component.scss']
})
export class FrqmapComponent implements OnInit {
  formOptions : FormOptionResponse;
  map: Map;
  currentVectorLayer: VectorLayer | null = null
  selectedOperator: String;
  currentOverlay : TileLayer
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
      view: new View({
        center: [0, 0],
        zoom: 10
      }),
      layers: [],
      target: 'map'

    });

    var textent : Extent = [1252344.27125, 5846515.498922221, 1907596.397450879, 6284446.2299491335];
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
    let url = `${baseUrl}/settings`;
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
    const reference = "F7/16";
    let operator = this.selectedOperator;
    if (operator === null || operator === "null" || operator === "default") {
      operator = "@all"
    }

    let url = `${baseUrl}/tileurl?and=(operator.eq.${operator},reference.eq.${reference})&limit=1`

    console.log(this.selectedOperator);

    this.http.get<LayerConfiguration>(url, {
      headers: {
        "Accept": "application/vnd.pgrst.object+json"
      }
    })
      .subscribe((val) => {
        console.log(val.url)
        this.changeOverlaySource(val.url);
      });

  }

  private loadInformationForPoint(coords : Coordinate) : void {
    let long = coords[0];
    let lat = coords[1];

    let url = `${baseUrl}/rpc/cov?x=${long}&y=${lat}`

    this.http.get<PointInformation[]>(url, {
      headers: {
        "Accept": "application/json"
      }
    })
      .subscribe((val) => {
        if (val.length > 0) {
          this.pointInfo = val

          let first = val[0];

          if (this.currentVectorLayer !== null) {
            this.map.removeLayer(this.currentVectorLayer);
            this.currentVectorLayer = null;
          }

          //draw geojson
          var vectorSource = new VectorSource({
            features: [
              new Feature({
                geometry: new GeoJSON().readGeometry(first.geojson).transform('EPSG:4326', 'EPSG:3857'),
                projection: olProj.get('EPSG:3857')
              })
            ],

          });
          this.currentVectorLayer = new VectorLayer({
            source: vectorSource
            /*,style: new ol.style.Style ({
                fill: new ol.style.Fill({
                    color: 'rgba(255,100,50,0.5)'
                })
            })*/,

          })
          //this.map.addLayer(this.currentVectorLayer);
        }
        else {
          this.pointInfo = null
          console.log("unset")
        }
      })


  }

  private changeOverlaySource(url: String) :void {
    if (this.currentOverlay != null) {
      this.map.removeLayer(this.currentOverlay)
    }

    const tileUrl = `${url}/{z}/{x}/{y}.png`;
    this.currentOverlay = new TileLayer({
      source: new XYZ({
          url: tileUrl,
          projection: olProj.get('EPSG:3857'),
          maxZoom: 16
        }
      ),
      visible: true,
      opacity: 1.0
    });

    this.map.addLayer(this.currentOverlay);
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
