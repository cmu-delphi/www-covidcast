import { EpiWeek } from '../../../data/EpiWeek';

export interface CalendarDay {
  partOfMonth: boolean;
  day: number;
  month: number;
  year: number;
  date: Date;
}

export interface CalendarWeek {
  id: string;
  week: EpiWeek;
  days: CalendarDay[];
}

export interface CalendarMonth {
  month: number;
  year: number;
  weeks: CalendarWeek[];
}

function getCalendarPage(
  month: number,
  year: number,
  dayProps: (date: Date) => Record<string, unknown>,
  weekStart = 0,
): CalendarMonth {
  const date = new Date(year, month, 1);
  date.setDate(date.getDate() - date.getDay() + weekStart);
  const nextMonth = month === 11 ? 0 : month + 1;
  // ensure days starts on Sunday
  // and end on saturday
  const weeks: CalendarWeek[] = [];
  while (date.getMonth() !== nextMonth || date.getDay() !== weekStart || weeks.length !== 6) {
    if (date.getDay() === weekStart) {
      weeks.unshift({ days: [], id: `${year}${month}${year}${weeks.length}`, week: EpiWeek.fromDate(date) });
    }
    const updated = Object.assign(
      {
        partOfMonth: date.getMonth() === month,
        day: date.getDate(),
        month: date.getMonth(),
        year: date.getFullYear(),
        date: new Date(date),
      },
      dayProps(date),
    );
    weeks[0].days.push(updated);
    date.setDate(date.getDate() + 1);
  }
  weeks.reverse();

  return { month, year, weeks };
}

function getDayPropsHandler(start: Date, end: Date, selectableCallback?: (date: Date) => boolean) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return (date: Date) => {
    const isInRange = date >= start && date <= end;
    return {
      isInRange,
      selectable: isInRange && (!selectableCallback || selectableCallback(date)),
      isToday: date.getTime() === today.getTime(),
    };
  };
}

export function getMonths(
  start: Date,
  end: Date,
  selectableCallback: undefined | ((date: Date) => boolean) = undefined,
  weekStart = 0,
): CalendarMonth[] {
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const endDate = new Date(end.getFullYear(), end.getMonth() + 1, 1);
  const months: CalendarMonth[] = [];
  const date = new Date(start.getFullYear(), start.getMonth(), 1);
  const dayPropsHandler = getDayPropsHandler(start, end, selectableCallback);
  while (date < endDate) {
    months.push(getCalendarPage(date.getMonth(), date.getFullYear(), dayPropsHandler, weekStart));
    date.setMonth(date.getMonth() + 1);
  }

  if (months.length === 0) {
    // return at least one month
    months.push(getCalendarPage(start.getMonth(), start.getFullYear(), dayPropsHandler, weekStart));
  }

  return months;
}

export function areDatesEquivalent(a: Date, b: Date): boolean {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}
