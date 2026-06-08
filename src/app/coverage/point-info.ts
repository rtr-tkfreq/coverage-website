import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ALL_OPERATORS } from '../core/coverage-api.service';
import { DmsPipe } from '../shared/dms-pipe';
import { FormatBpsPipe } from '../shared/format-bps-pipe';
import { CoverageStore } from './coverage-store';

/** Panel showing coverage + administrative details for a clicked point. */
@Component({
  selector: 'app-point-info',
  imports: [DatePipe, DmsPipe, FormatBpsPipe],
  templateUrl: './point-info.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PointInfo {
  protected readonly store = inject(CoverageStore);

  /** Human-readable operator label for an operator code. */
  protected operatorLabel(value: string): string {
    const match = this.store.operators().find((o) => (o.operator ?? ALL_OPERATORS) === value);
    return match?.label ?? value;
  }
}
