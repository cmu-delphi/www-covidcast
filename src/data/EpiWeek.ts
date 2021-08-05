// based on https://github.com/reichlab/mmwr-week/blob/master/index.ts but without moment

import { timeDay, timeYear } from 'd3-time';
import { timeFormat } from 'd3-time-format';

export function startDateOfYear(year: number): Date {
  const janOne = timeYear(new Date(year, 0, 1));
  const weekDay = Number.parseInt(timeFormat('%u')(janOne), 10);
  const diff = 7 * +(weekDay > 3) - weekDay;
  return timeDay.offset(janOne, diff);
}

export function epiweekToDate(year: number, week: number): Date {
  const dayOne = startDateOfYear(year);
  const diff = 7 * (week - 1);
  return timeDay.offset(dayOne, diff);
}

export class EpiWeek {
  constructor(public readonly year: number, public readonly week: number = 1) {}

  static parse(value: number | string): EpiWeek {
    const v = typeof value === 'number' ? value : Number.parseInt(value.replace('-', '').replace('W', ''), 10);
    const year = Math.floor(v / 100);
    const week = v % 100;
    return new EpiWeek(year, week);
  }

  toDate(): Date {
    const dayOne = startDateOfYear(this.year);
    const diff = 7 * (this.week - 1);
    return timeDay.offset(dayOne, diff);
  }

  /**
   * Set values using given moment date. Defaults to now.
   */
  static fromDate(date: Date): EpiWeek {
    const year = date.getFullYear();
    const startDates = [year - 1, year, year + 1].map((y) => startDateOfYear(y));
    const diffs = startDates.map((d) => timeDay.count(d, date));

    let startId = 1;
    if (diffs[1] < 0) {
      startId = 0;
    } else if (diffs[2] >= 0) {
      startId = 2;
    }
    const startDate = startDates[startId];

    const epiYear = timeDay.offset(startDate, 7).getFullYear();
    const epiWeek = Math.floor(timeDay.count(startDate, date) / 7) + 1;
    return new EpiWeek(epiYear, epiWeek);
  }

  format(): number {
    return this.year * 100 + this.week;
  }
}
