import { ChangeDetectionStrategy, Component } from '@angular/core';

import { CoverageMap } from './coverage/coverage-map';

/** Application shell: RTR page chrome (header, breadcrumbs, footer) around the map. */
@Component({
  selector: 'app-root',
  imports: [CoverageMap],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
