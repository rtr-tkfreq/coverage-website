import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Coverage-quality colour legend, shown on both the intro and the info panel. */
@Component({
  selector: 'app-legend',
  templateUrl: './legend.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Legend {}
