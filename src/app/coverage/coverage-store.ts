import { Injectable, computed, inject, signal } from '@angular/core';

import {
  FormOptionResponse,
  Operator,
  OperatorObligation,
  PointInfoCoverage,
  PointInfoIds,
} from '../core/models';
import { ALL_OPERATORS, CoverageApiService } from '../core/coverage-api.service';

/**
 * Signal-based state container for the coverage map. Coordinates calls to
 * {@link CoverageApiService} and exposes the current selection and point info.
 * Provided per map component instance.
 */
@Injectable()
export class CoverageStore {
  private readonly api = inject(CoverageApiService);

  private readonly _formOptions = signal<FormOptionResponse | null>(null);
  private readonly _selectedOperator = signal<string>(ALL_OPERATORS);
  private readonly _selectedObligation = signal<string | null>(null);
  private readonly _selectedReference = signal<string | null>(null);
  private readonly _coverageUrl = signal<string | null>(null);
  private readonly _obligationUrls = signal<string[] | null>(null);
  private readonly _pointInfoCov = signal<PointInfoCoverage[] | null>(null);
  private readonly _pointInfoIds = signal<PointInfoIds[] | null>(null);
  private readonly _pointPolygon = signal<string | object | null>(null);
  private readonly _clickedCoord = signal<[number, number] | null>(null);

  readonly operators = computed<Operator[]>(() => this._formOptions()?.filter.operators ?? []);
  readonly selectedOperator = this._selectedOperator.asReadonly();
  readonly selectedObligation = this._selectedObligation.asReadonly();
  readonly obligations = computed<OperatorObligation[] | null>(
    () => this.operatorByValue(this._selectedOperator())?.obligations ?? null,
  );
  readonly coverageUrl = this._coverageUrl.asReadonly();
  readonly obligationUrls = this._obligationUrls.asReadonly();
  readonly pointInfoCov = this._pointInfoCov.asReadonly();
  readonly pointInfoIds = this._pointInfoIds.asReadonly();
  readonly pointPolygon = this._pointPolygon.asReadonly();
  readonly clickedCoord = this._clickedCoord.asReadonly();

  /** Loads settings and the initial coverage layer. */
  init(): void {
    this.api.getSettings().subscribe((options) => {
      this._formOptions.set(options);
      const fallback = options.filter.operators.find((o) => o.default);
      this._selectedOperator.set(fallback?.operator ?? ALL_OPERATORS);
      this.reloadMap();
    });
  }

  setOperator(operator: string): void {
    this._selectedOperator.set(operator);
    this._selectedObligation.set(null);
    this.reloadMap();
  }

  setObligation(obligation: string | null): void {
    this._selectedObligation.set(obligation);
    this.reloadMap();
  }

  /** Loads coverage + administrative info for a clicked WGS84 point. */
  selectPoint(longitude: number, latitude: number): void {
    this._clickedCoord.set([longitude, latitude]);
    const operator = this._selectedOperator();
    const reference = this._selectedReference();

    this.api.getCoverageForPoint(longitude, latitude, operator, reference).subscribe((cov) => {
      if (cov.length) {
        this._pointInfoCov.set(cov);
        this._pointPolygon.set(cov[0].geojson);
      } else {
        this._pointInfoCov.set(null);
        this._pointPolygon.set(null);
      }
    });

    this.api.getIdsForPoint(longitude, latitude).subscribe((ids) => {
      if (ids.length) {
        ids[0].request_latitude = latitude;
        ids[0].request_longitude = longitude;
        this._pointInfoIds.set(ids);
      } else {
        this._pointInfoIds.set(null);
      }
    });
  }

  /** Clears the clicked-point info (dismisses the overlay and the highlighted cell). */
  clearPoint(): void {
    this._pointInfoCov.set(null);
    this._pointInfoIds.set(null);
    this._pointPolygon.set(null);
    this._clickedCoord.set(null);
  }

  private reloadMap(): void {
    const operator = this._selectedOperator();

    this.api.getTileUrl(operator, null).subscribe((config) => {
      this._selectedReference.set(config.reference ?? null);
      this._coverageUrl.set(config.url);
    });

    const obligation = this._selectedObligation();
    const source = obligation
      ? this.operatorByValue(operator)?.obligations?.find((o) => o.type === obligation)?.source
      : undefined;
    this._obligationUrls.set(source ?? null);
  }

  private operatorByValue(value: string): Operator | undefined {
    return this._formOptions()?.filter.operators.find((o) => (o.operator ?? ALL_OPERATORS) === value);
  }
}
