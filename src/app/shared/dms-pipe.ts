import { Pipe, PipeTransform } from '@angular/core';

/** Formats decimal degrees as degrees/minutes/seconds, e.g. `48° 12' 30.5"`. */
@Pipe({ name: 'dms' })
export class DmsPipe implements PipeTransform {
  transform(dd: number | null | undefined): string {
    if (dd == null) {
      return '';
    }
    const deg = dd | 0;
    const frac = Math.abs(dd - deg);
    const min = (frac * 60) | 0;
    const sec = ((frac * 3600 - min * 60) * 1000 | 0) / 1000;
    return `${deg}° ${min}' ${sec}"`;
  }
}
