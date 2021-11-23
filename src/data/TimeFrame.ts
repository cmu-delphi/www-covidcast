import { timeDay } from 'd3-time';
import type { EpiDataRow } from '.';
import { formatDateLocal } from '../formats';
import { EpiWeek } from './EpiWeek';
import { parseAPITime, toTimeValue } from './utils';

export const yesterdayDate = timeDay.offset(timeDay(new Date()), -1);
export const yesterday = toTimeValue(yesterdayDate);

export class TimeFrame {
  readonly min: Date;
  readonly min_time: number;
  readonly min_week: EpiWeek;
  readonly max: Date;
  readonly max_time: number;
  readonly max_week: EpiWeek;
  readonly range: string;
  readonly week_range: string;
  readonly domain: [number, number];
  readonly filter: (row: EpiDataRow) => boolean;

  constructor(min: Date, max: Date, minWeek = EpiWeek.fromDate(min), maxWeek = EpiWeek.fromDate(max)) {
    this.min = min;
    this.min_week = minWeek;
    this.min_time = toTimeValue(min);
    this.max = max;
    this.max_week = maxWeek;
    this.max_time = toTimeValue(max);
    this.range = `${this.min_time}-${this.max_time}`;
    this.week_range = `${this.min_week.format()}-${this.max_week.format()}`;
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

  static fromEpiWeek(epiweek: EpiWeek): TimeFrame {
    const d = epiweek.toDate();
    return new TimeFrame(d, epiweek.toEndDate(), epiweek, epiweek);
  }

  shift(minShiftInDays = 0, maxShiftInDays = 0): TimeFrame {
    return new TimeFrame(timeDay.offset(this.min, minShiftInDays), timeDay.offset(this.max, maxShiftInDays));
  }

  equals(that: TimeFrame): boolean {
    return this.range === that.range;
  }

  includes(date: Date | EpiWeek): boolean {
    if (date instanceof EpiWeek) {
      return date.compareTo(this.min_week) >= 0 && date.compareTo(this.max_week) <= 0;
    }
    return date >= this.min && date <= this.max;
  }

  overlaps(timeFrame: TimeFrame): boolean {
    // not outside of the range, so at least a partial overlap
    return !(timeFrame.max < this.min || timeFrame.min > this.max);
  }

  toString(): string {
    return this.range;
  }

  toNiceString(type: 'day' | 'week' = 'day'): string {
    const isWeekly = type === 'week';
    return `between ${isWeekly ? this.min_week.toString() : formatDateLocal(this.min)} and ${
      isWeekly ? this.max_week.toString() : formatDateLocal(this.max)
    }`;
  }

  asTypeRange(type: 'day' | 'week'): string {
    if (type == 'day') {
      return this.range;
    }
    return this.week_range;
  }
}

export const ALL_TIME_FRAME = new TimeFrame(parseAPITime('20200101'), yesterdayDate);
