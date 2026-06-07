import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CoverageStore } from './coverage-store';

/** Operator selector plus the optional "obligation" overlay selector. */
@Component({
  selector: 'app-filter-bar',
  imports: [FormsModule],
  templateUrl: './filter-bar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterBar {
  protected readonly store = inject(CoverageStore);
}
