import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { FormOptionResponse, LayerConfiguration, PointInfoCoverage, PointInfoIds } from '../core/models';
import { CoverageApiService } from '../core/coverage-api.service';
import { CoverageStore } from './coverage-store';

const SETTINGS: FormOptionResponse = {
  filter: {
    operators: [
      { label: '@all', default: true, operator: null, obligations: [{ type: 'kg', source: ['/o/kg'] }] },
      { label: 'A1 Telekom Austria', default: false, operator: 'A1TA' },
    ],
  },
};

const fakeApi: Partial<CoverageApiService> = {
  getSettings: () => of(SETTINGS),
  getTileUrl: () =>
    of({ operator: '@all', reference: null, date: '2026-03-31', url: '/cov/all' } as LayerConfiguration),
  getCoverageForPoint: () =>
    of([
      { operator: 'A1TA', license: 'F1/16', geojson: '{"type":"Point","coordinates":[14,48]}', downloadkbitnormal: 50000 },
    ] as unknown as PointInfoCoverage[]),
  getIdsForPoint: () => of([{ vgd_kg: 'Test' } as unknown as PointInfoIds]),
};

describe('CoverageStore', () => {
  let store: CoverageStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CoverageStore, { provide: CoverageApiService, useValue: fakeApi }],
    });
    store = TestBed.inject(CoverageStore);
  });

  it('loads settings, default operator and coverage layer on init', () => {
    store.init();
    expect(store.selectedOperator()).toBe('@all');
    expect(store.coverageUrl()).toBe('/cov/all');
    expect(store.obligations()).toHaveLength(1);
  });

  it('shows obligation overlay urls when an obligation is selected', () => {
    store.init();
    store.setObligation('kg');
    expect(store.obligationUrls()).toEqual(['/o/kg']);
  });

  it('resets obligation when the operator changes', () => {
    store.init();
    store.setObligation('kg');
    store.setOperator('A1TA');
    expect(store.selectedObligation()).toBeNull();
    expect(store.obligations()).toBeNull();
  });

  it('loads coverage, polygon and ids for a clicked point', () => {
    store.init();
    store.selectPoint(14, 48);
    expect(store.pointInfoCov()).toHaveLength(1);
    expect(store.pointPolygon()).toBeTruthy();
    expect(store.pointInfoIds()?.[0].request_latitude).toBe(48);
  });
});
