import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { FormOptionResponse, LayerConfiguration, PointInfoCoverage, PointInfoIds } from './models';

/** Sentinel used by the UI for the "all operators" selection. */
export const ALL_OPERATORS = '@all';

/**
 * Thin wrapper around the PostgREST coverage API exposed under `/api`.
 */
@Injectable({ providedIn: 'root' })
export class CoverageApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  private readonly singleObject = { headers: { Accept: 'application/vnd.pgrst.object+json' } };
  private readonly jsonArray = { headers: { Accept: 'application/json' } };

  /** Filter options (operators + obligations) shown in the UI. */
  getSettings(): Observable<FormOptionResponse> {
    return this.http.get<FormOptionResponse>(`${this.baseUrl}/settings`, this.singleObject);
  }

  /** The coverage tile layer configuration for an operator (and optional reference). */
  getTileUrl(operator: string, reference: string | null): Observable<LayerConfiguration> {
    const filter = reference
      ? `and=(operator.eq.${operator},reference.eq.${reference})`
      : `and=(operator.eq.${operator})`;
    return this.http.get<LayerConfiguration>(
      `${this.baseUrl}/tileurl?${filter}&limit=1`,
      this.singleObject,
    );
  }

  /** Coverage details for a clicked WGS84 point. */
  getCoverageForPoint(
    longitude: number,
    latitude: number,
    operator: string | null,
    reference: string | null,
  ): Observable<PointInfoCoverage[]> {
    const params: Record<string, string> = {
      cov_longitude: String(longitude),
      cov_latitude: String(latitude),
    };
    if (operator && operator !== ALL_OPERATORS) {
      params['cov_operator'] = operator;
    }
    if (reference) {
      params['cov_reference'] = reference;
    }
    const query = new URLSearchParams(params).toString();
    return this.http.get<PointInfoCoverage[]>(`${this.baseUrl}/rpc/cov?${query}`, this.jsonArray);
  }

  /** Administrative / geographic identifiers for a clicked WGS84 point. */
  getIdsForPoint(longitude: number, latitude: number): Observable<PointInfoIds[]> {
    const query = new URLSearchParams({
      cov_longitude: String(longitude),
      cov_latitude: String(latitude),
    }).toString();
    return this.http.get<PointInfoIds[]>(`${this.baseUrl}/rpc/id?${query}`, this.jsonArray);
  }
}
