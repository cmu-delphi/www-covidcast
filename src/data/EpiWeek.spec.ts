import { parseAPITime } from './utils';
import { EpiWeek, startDateOfYear, weeksInYear } from './EpiWeek';

describe('startDateOfYear', () => {
  it('correct dates', () => {
    // [epiweeks.Year(y).startdate() for y in range(2010, 2021)]
    expect(startDateOfYear(2010)).toEqual(parseAPITime('20100103'));
    expect(startDateOfYear(2011)).toEqual(parseAPITime('20110102'));
    expect(startDateOfYear(2012)).toEqual(parseAPITime('20120101'));
    expect(startDateOfYear(2013)).toEqual(parseAPITime('20121230'));
    expect(startDateOfYear(2014)).toEqual(parseAPITime('20131229'));
    expect(startDateOfYear(2015)).toEqual(parseAPITime('20150104'));
    expect(startDateOfYear(2016)).toEqual(parseAPITime('20160103'));
    expect(startDateOfYear(2017)).toEqual(parseAPITime('20170101'));
    expect(startDateOfYear(2018)).toEqual(parseAPITime('20171231'));
    expect(startDateOfYear(2019)).toEqual(parseAPITime('20181230'));
    expect(startDateOfYear(2020)).toEqual(parseAPITime('20191229'));
  });
});

describe('weeksInYear', () => {
  it('correct dates', () => {
    // {y: Year(y).totalweeks() for y in range(2010, 2021)}
    expect(weeksInYear(2010)).toEqual(52);
    expect(weeksInYear(2011)).toEqual(52);
    expect(weeksInYear(2012)).toEqual(52);
    expect(weeksInYear(2013)).toEqual(52);
    expect(weeksInYear(2014)).toEqual(53);
    expect(weeksInYear(2015)).toEqual(52);
    expect(weeksInYear(2016)).toEqual(52);
    expect(weeksInYear(2017)).toEqual(52);
    expect(weeksInYear(2018)).toEqual(52);
    expect(weeksInYear(2019)).toEqual(52);
    expect(weeksInYear(2020)).toEqual(53);
  });
});

describe('EpiWeek', () => {
  it('should initialize correctly', () => {
    const mdate = new EpiWeek(2016, 48);
    expect(mdate.year).toBe(2016);
    expect(mdate.week).toBe(48);
  });

  it('should return correct moment date', () => {
    expect(new EpiWeek(2016, 48).toDate()).toEqual(parseAPITime('20161127'));
    expect(new EpiWeek(2021, 1).toDate()).toEqual(parseAPITime('20210103'));
  });

  it('should read correctly from moment date', () => {
    expect(EpiWeek.fromDate(parseAPITime('20190101')!).format()).toBe(201901);
    expect(EpiWeek.fromDate(parseAPITime('20200101')!).format()).toBe(202001);
    expect(EpiWeek.fromDate(parseAPITime('20210101')!).format()).toBe(202053);
    expect(EpiWeek.fromDate(parseAPITime('20210102')!).format()).toBe(202053);
    expect(EpiWeek.fromDate(parseAPITime('20210103')!).format()).toBe(202101);
    expect(EpiWeek.fromDate(parseAPITime('20210104')!).format()).toBe(202101);

    expect(EpiWeek.fromDate(parseAPITime('20220101')!).format()).toBe(202152);
    expect(EpiWeek.fromDate(parseAPITime('20230101')!).format()).toBe(202301);

    expect(EpiWeek.fromDate(parseAPITime('20210805')!).format()).toBe(202131);
    expect(EpiWeek.fromDate(parseAPITime('20161227')!).format()).toBe(201652);
  });

  it('should return correct epiweek', () => {
    const mdate = new EpiWeek(2016, 52);
    expect(mdate.format()).toBe(201652);
  });

  it('should read correctly from epiweek', () => {
    const mdate = EpiWeek.parse(201732);
    expect(mdate.year).toBe(2017);
    expect(mdate.week).toBe(32);
  });
});
