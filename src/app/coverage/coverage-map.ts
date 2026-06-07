import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MapService } from '../map/map.service';
import { CoverageStore } from './coverage-store';
import { FilterBar } from './filter-bar';
import { Legend } from './legend';
import { PointInfo } from './point-info';

/**
 * Top-level coverage view. Owns the {@link CoverageStore} and {@link MapService}
 * instances and keeps the OpenLayers layers in sync with the store signals.
 */
@Component({
  selector: 'app-coverage-map',
  imports: [FilterBar, PointInfo, Legend],
  templateUrl: './coverage-map.html',
  providers: [CoverageStore, MapService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoverageMap {
  protected readonly store = inject(CoverageStore);
  private readonly map = inject(MapService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.store.init();

    // Keep map layers in sync with store state.
    effect(() => this.map.showCoverage(this.store.coverageUrl()));
    effect(() => this.map.setObligationOverlays(this.store.obligationUrls()));
    effect(() => this.map.showPointPolygon(this.store.pointPolygon()));

    this.map.click$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((click) => this.store.selectPoint(click.longitude, click.latitude));

    afterNextRender(() => {
      this.map.init('map');
      this.map.showCoverage(this.store.coverageUrl());
      this.map.setObligationOverlays(this.store.obligationUrls());
      this.map.showPointPolygon(this.store.pointPolygon());
    });

    this.destroyRef.onDestroy(() => this.map.destroy());
  }
}
