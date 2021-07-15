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
import {Attribution} from "ol/control";
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
const baseMapCapabilities: String = "https://basemap.at/wmts/1.0.0/WMTSCapabilities.xml";

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
      layers: [
        new TileLayer({
          source: new OSM({
            url: osmServer + '/{z}/{x}/{y}.png'
          })
        }),
      ],
      target: 'map'
    });

    var textent : Extent = [1252344.27125, 5846515.498922221, 1907596.397450879, 6284446.2299491335];
    this.map.getView().fit(textent, {size: this.map.getSize()});

    let bases : TileLayer[] = []
    this.addBasemapLayers(bases);

    bases.forEach((base) => {
      this.map.addLayer(base)
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
          this.map.addLayer(this.currentVectorLayer);
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

  private addBasemapLayers(bases: TileLayer[]): void {

      var templatepng =
        '{Layer}/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png';
      var urlsbmappng = [
        '//maps1.wien.gv.at/basemap/' + templatepng,
        '//maps2.wien.gv.at/basemap/' + templatepng,
        '//maps3.wien.gv.at/basemap/' + templatepng,
        '//maps4.wien.gv.at/basemap/' + templatepng
      ];

      var templatejpeg =
        '{Layer}/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpeg';
      var urlsbmapjpeg = [
        '//maps1.wien.gv.at/basemap/' + templatejpeg,
        '//maps2.wien.gv.at/basemap/' + templatejpeg,
        '//maps3.wien.gv.at/basemap/' + templatejpeg,
        '//maps4.wien.gv.at/basemap/' + templatejpeg
      ];

      var LayerTypes = {
        BMAPGREY:  {
          label: ("basemap_bmapgrau"),
          layer: "bmapgrau",
          tilePixelRatio : 1,
          urls: urlsbmappng
        },
        BASEMAP:  {
          label: ("basemap_geolandbasemap"),
          layer: "geolandbasemap",
          tilePixelRatio : 1,
          urls: urlsbmappng
        },
        BMAPHIDPI:  {
          label: ("basemap_bmaphidpi"),
          layer: "bmaphidpi",
          tilePixelRatio : 2,
          urls: urlsbmapjpeg
        },
        BMAPORTHO:  {
          label: ("basemap_bmaporthofoto30cm"),
          layer: "bmaporthofoto30cm",
          tilePixelRatio : 1,
          urls: urlsbmapjpeg
        }
      };

      var addBasemapLayer = function (layerType : any) {
        // basemap.at
        //taken from http://www.basemap.at/application/js/mobile-base3.js
        var gg = olProj.get('EPSG:4326');
        var sm = olProj.get('EPSG:3857');


        var IS_CROSS_ORIGIN = 'anonymous';

        var tilegrid = new WMTSGrid({
          origin: [-20037508.3428, 20037508.3428],
          extent: [977650, 5838030, 1913530, 6281290],
          resolutions: [
            156543.03392811998, 78271.51696419998,
            39135.758481959994, 19567.879241008,
            9783.939620504, 4891.969810252,
            2445.984905126, 1222.9924525644,
            611.4962262807999, 305.74811314039994,
            152.87405657047998, 76.43702828523999,
            38.21851414248, 19.109257071295996,
            9.554628535647998, 4.777314267823999,
            2.3886571339119995, 1.1943285669559998,
            0.5971642834779999, 0.29858214174039993
          ],
          matrixIds: [
            '0', '1', '2', '3', '4', '5',
            '6', '7', '8', '9', '10',
            '11', '12', '13', '14', '15',
            '16', '17', '18', '19'
          ]
        });


        var bmap = new WMTSSource({
          tilePixelRatio: layerType.tilePixelRatio,
          projection: sm,
          layer: layerType.layer, //'geolandbasemap',
          /*layer: hiDPI ? 'bmaphidpi' : 'geolandbasemap',*/
          style: 'normal',
          matrixSet: 'google3857',
          urls: layerType.urls,
          //visible: true,
          //crossOrigin: IS_CROSS_ORIGIN,
          requestEncoding: /** @type {ol.source.WMTSRequestEncoding} */ ('REST'),
          tileGrid: tilegrid,
          /*attributions: [
            new Attribution({
              label: 'Tiles &copy; <a href="//www.basemap.at/">' +
                'basemap.at</a> (STANDARD).'
            })
          ]*/
        });

        bases.push(new TileLayer({
          visible: false,
          preload: Infinity,
          source: bmap
          //title: "layerType.label",
          //type: 'base'
        }));
      };

      //add in reverse order
      addBasemapLayer(LayerTypes.BMAPORTHO);
      addBasemapLayer(LayerTypes.BMAPGREY);
      //addBasemapLayer(LayerTypes.BMAPHIDPI);
      addBasemapLayer(LayerTypes.BASEMAP);
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
