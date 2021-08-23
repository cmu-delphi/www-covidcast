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

  toEndDate(): Date {
    return timeDay.offset(this.toDate(), 6);
  }

  static thisWeek(): EpiWeek {
    return EpiWeek.fromDate(new Date());
  }

  static fromDate(date: Date): EpiWeek;
  static fromDate(date: Date | null): EpiWeek | null;
  /**
   * Set values using given moment date. Defaults to now.
   */
  static fromDate(date: Date | null): EpiWeek | null {
    if (date == null) {
      return null;
    }
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

  toString(): string {
    return `${this.year}W${this.week < 10 ? '0' : ''}${this.week}`;
  }

  compareTo(other: EpiWeek): number {
    return this.format() - other.format();
  }

  equals(other: EpiWeek): boolean {
    return this.compareTo(other) === 0;
  }

  includes(date: Date): boolean {
    if (!date) {
      return false;
    }
    const week = this.toDate();
    const diff = timeDay.count(week, date);
    return diff >= 0 && diff < 7;
  }
}

export function weeksInYear(year: number): number {
  const lastDay = timeDay.offset(startDateOfYear(year + 1), -1);
  const w = EpiWeek.fromDate(lastDay);
  return w.week;
}

export function weekRange(start: EpiWeek, end: EpiWeek, including = true): EpiWeek[] {
  const r: EpiWeek[] = [];
  if (start.format() > end.format()) {
    return [];
  }
  if (start.format() === end.format()) {
    if (including) {
      r.push(start);
    }
    return r;
  }
  let weekStart = start.week;
  if (start.year < end.year) {
    // rest of start year
    const startWeeks = weeksInYear(start.year);
    for (let i = start.week; i <= startWeeks; i++) {
      r.push(new EpiWeek(start.year, i));
    }
    // all years
    for (let year = start.year + 1; year < end.year; year++) {
      const total = weeksInYear(year);
      for (let i = 1; i <= total; i++) {
        r.push(new EpiWeek(year, i));
      }
    }
    // rest of last year
    weekStart = 1;
  }
  for (let week = weekStart; week < end.week; week++) {
    r.push(new EpiWeek(end.year, week));
  }
  if (including) {
    r.push(end);
  }
  return r;
}
