import { timeDay, timeWeek } from 'd3-time';
import type { EpiDataRow } from '.';
import { EpiWeek, weekRange } from './EpiWeek';
import { parseAPITime, toTimeValue, toTimeWeekValue } from './utils';

export const yesterdayDate = new Date(new Date().getTime() - 86400 * 1000);
export const yesterday = toTimeValue(yesterdayDate);

export class TimeFrame {
  readonly type: 'day' | 'week';
  readonly min: Date;
  readonly min_time: number;
  readonly max: Date;
  readonly max_time: number;
  readonly difference: number;
  readonly range: string;
  readonly domain: [number, number];
  readonly filter: (row: EpiDataRow) => boolean;

  constructor(min: Date, max: Date, type: 'day' | 'week' = 'day') {
    this.type = type;
    this.min = min;
    this.min_time = type === 'day' ? toTimeValue(min) : toTimeWeekValue(min);
    this.max = max;
    this.max_time = type == 'day' ? toTimeValue(max) : toTimeWeekValue(max);
    this.difference = (type === 'day' ? timeDay : timeWeek).count(min, max);
    this.range = `${this.min_time}-${this.max_time}`;
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

  asWeekFrame(): TimeFrame {
    if (this.type === 'week') {
      return this;
    }
    return new TimeFrame(EpiWeek.fromDate(this.min).toDate(), EpiWeek.fromDate(this.max).toDate(), 'week');
  }

  asDayFrame(): TimeFrame {
    if (this.type === 'day') {
      return this;
    }
    return new TimeFrame(this.min, this.max, 'day');
  }

  asType(type: 'day' | 'week'): TimeFrame {
    return type == 'day' ? this.asDayFrame() : this.asWeekFrame();
  }

  asListRange(): string {
    if (this.type === 'day') {
      return timeDay
        .range(this.min, timeDay.offset(this.max, 1))
        .map((d) => toTimeValue(d))
        .join(',');
    }
    return weekRange(EpiWeek.fromDate(this.min), EpiWeek.fromDate(this.max), true)
      .map((d) => d.format())
      .join(',');
  }
}

export const ALL_TIME_FRAME = new TimeFrame(parseAPITime('20200101'), yesterdayDate);
