import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import sampleResponseToReq1, {FormOptionResponse} from './sample1';

import Map from "ol/Map";
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';

@Component({
  selector: 'app-frqmap',
  templateUrl: './frqmap.component.html',
  styleUrls: ['./frqmap.component.scss']
})
export class FrqmapComponent implements OnInit {
  formOptions : FormOptionResponse;
  map: Map
  selectedOperator: String;

  constructor() { }

  ngOnInit(): void {
    console.log("init")
    //@TODO: Request input for options
    this.formOptions = sampleResponseToReq1;
    this.initMap()
  }

  private initMap(): void {
    this.map = new Map({
      view: new View({
        center: [0, 0],
        zoom: 10,
      }),
      layers: [
        new TileLayer({
          source: new OSM()
        }),
      ],
      target: 'map'
    });
  }

  reloadMap() : void {
    console.log(this.selectedOperator);
  }

}
