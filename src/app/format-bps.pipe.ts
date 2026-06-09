import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats a Mbit/s value for display, with locale-aware grouping:
 * no decimals at/above 10, one decimal between 1 and 10, two decimals below 1.
 */
@Pipe({
  standalone: false,
  name: 'formatBps',
})
export class FormatBpsPipe implements PipeTransform {
  transform(mbps: number): string {
    if (mbps >= 10) {
      return Math.round(mbps).toLocaleString();
    }
    if (mbps > 1) {
      return (Math.round(mbps * 10) / 10).toLocaleString();
    }
    return (Math.round(mbps * 100) / 100).toLocaleString();
  }
}
