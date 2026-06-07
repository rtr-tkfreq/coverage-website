import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats a Mbit/s value with a sensible number of decimals:
 * none above 10, one above 1, two below.
 */
@Pipe({ name: 'formatBps' })
export class FormatBpsPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null) {
      return '';
    }
    if (value >= 10) {
      return Math.round(value).toLocaleString();
    }
    if (value > 1) {
      return (Math.round(value * 10) / 10).toLocaleString();
    }
    return (Math.round(value * 100) / 100).toLocaleString();
  }
}
