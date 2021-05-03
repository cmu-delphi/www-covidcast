import { timeDay } from 'd3-time';
import type { EpiDataRow } from '.';
import { yesterdayDate } from '../stores';
import { formatAPITime } from './utils';

export class TimeFrame {
  readonly min: Date;
  readonly max: Date;
  readonly difference: number;
  readonly range: string;
  readonly domain: [number, number];
  readonly filter: (row: EpiDataRow) => boolean;

  constructor(min: Date, max: Date) {
    this.min = min;
    this.max = max;
    this.difference = timeDay.count(min, max);
    this.range = `${formatAPITime(min)}-${formatAPITime(max)}`;
    this.domain = [min.getTime(), max.getTime()];
    /**
     * @param {EpiDataRow} row
     */
    this.filter = (row) => {
      return row.date_value >= this.min && row.date_value <= this.max;
    };
  }

  static compute(
    date: Date,
    offset: (date: Date, step: number) => Date,
    offsetFactor: number,
    maxDate = yesterdayDate,
  ): TimeFrame {
    let max = offset(date, offsetFactor / 2);
    if (max > maxDate) {
      max = maxDate;
    }
    const min = offset(max, -offsetFactor);
    return new TimeFrame(min, max);
  }

  shift(minShiftInDays = 0, maxShiftInDays = 0): TimeFrame {
    return new TimeFrame(timeDay.offset(this.min, minShiftInDays), timeDay.offset(this.max, maxShiftInDays));
  }

  equals(that: TimeFrame): boolean {
    return this.range === that.range;
  }

  includes(date: Date): boolean {
    return date >= this.min && date <= this.max;
  }

  overlaps(timeFrame: TimeFrame): boolean {
    // not outside of the range, so at least a partial overlap
    return !(timeFrame.max < this.min || timeFrame.min > this.max);
  }

  toString(): string {
    return this.range;
  }
}
