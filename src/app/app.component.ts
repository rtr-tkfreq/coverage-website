import { Component } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'frq-map';
}

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  standalone: false,
  name: 'FormatBps'
})
export class FormatBps implements PipeTransform {
  transform(bps: number): String {
    var value;

    if (bps >= 10) // no decimals if value > 10
      value = Math.round(bps).toLocaleString();
    else if (bps > 1) //one decimal
      value = (Math.round(bps*10)/10).toLocaleString();
    else // two decimals
      value = (Math.round(bps*100)/100).toLocaleString();
    return value;
  }
}
