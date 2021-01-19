# Release 1.12.4

This release improves the UX of the survey dashboard for both desktop and mobile experience.

## New Features

- [#724](https://github.com/cmu-delphi/www-covidcast/pull/724), [#717](https://github.com/cmu-delphi/www-covidcast/pull/717) Survey dashboards improvements

## Bug-fixes

- [#719](https://github.com/cmu-delphi/www-covidcast/pull/719) (re: [#718](https://github.com/cmu-delphi/www-covidcast/issues/718)) fix Export Data bug

# Release 1.12.3

## Signal Changes

- Add "Vaccine Acceptance" signal to map and survey dashboard

## New Features

- [#709](https://github.com/cmu-delphi/www-covidcast/pull/709), [#710](https://github.com/cmu-delphi/www-covidcast/pull/710), [#708](https://github.com/cmu-delphi/www-covidcast/pull/708) Improve loading performance especially for the survey dashboard
- [#712](https://github.com/cmu-delphi/www-covidcast/pull/712) Improve map style

## Bug-fixes

- [#713](https://github.com/cmu-delphi/www-covidcast/pull/713) fix trend color for decreasing trends

# Release 1.12.1

Bugfix release for changed signal

## Signal Changes

- Reverted "COVID-Related Doctor Visits" signal

## Bug-fixes

- [#703](https://github.com/cmu-delphi/www-covidcast/pull/703) rename COVIDCast to COVIDcast

## Others

- [#704](https://github.com/cmu-delphi/www-covidcast/pull/704) Unique bundle names

# Release 1.12.1

Bugfix release for improved mobile experience

## Bug-fixes

- [#700](https://github.com/cmu-delphi/www-covidcast/pull/700) Improve mobile experience

# Release 1.12.0

This release introduces the new National COVID Survey Dashboard showing aggregated survey results. In addition, the overall style of COVIDcast has been adapted to the new website.

## New Features

- [#600](https://github.com/cmu-delphi/www-covidcast/pull/600) National COVID Survey Dashboard
- [#688](https://github.com/cmu-delphi/www-covidcast/pull/688) (re: [#536](https://github.com/cmu-delphi/www-covidcast/issues/536)) Default ratio cases/deaths
- [#616](https://github.com/cmu-delphi/www-covidcast/pull/616), [#678](https://github.com/cmu-delphi/www-covidcast/pull/678) UIKit Adaptations
- [#692](https://github.com/cmu-delphi/www-covidcast/pull/692), [#671](https://github.com/cmu-delphi/www-covidcast/pull/671) (re: [#651](https://github.com/cmu-delphi/www-covidcast/issues/651)) Simplify URL parameters
- [#677](https://github.com/cmu-delphi/www-covidcast/pull/677) (re: [#632](https://github.com/cmu-delphi/www-covidcast/issues/632)) Compute mega counties (`Rest of ...`) population on the fly
- [#658](https://github.com/cmu-delphi/www-covidcast/pull/658) (re: [#485](https://github.com/cmu-delphi/www-covidcast/issues/485), [#639](https://github.com/cmu-delphi/www-covidcast/issues/639)) Additional export options

## Improvements

- [#689](https://github.com/cmu-delphi/www-covidcast/pull/689) (re: [#687](https://github.com/cmu-delphi/www-covidcast/issues/687)) Change date shortcuts
- [#676](https://github.com/cmu-delphi/www-covidcast/pull/676) Improve Map Selection UX
- [#659](https://github.com/cmu-delphi/www-covidcast/pull/659) (re: [#656](https://github.com/cmu-delphi/www-covidcast/issues/656)) Shrink card header font size, adjust spacing.

## Bug-fixes

- [#690](https://github.com/cmu-delphi/www-covidcast/pull/690) (re: [#686](https://github.com/cmu-delphi/www-covidcast/issues/686)) Add special case for old safari
- [#674](https://github.com/cmu-delphi/www-covidcast/pull/674) Refactor: use vega resize method
- [#666](https://github.com/cmu-delphi/www-covidcast/pull/666) (re: [#664](https://github.com/cmu-delphi/www-covidcast/issues/664), [#665](https://github.com/cmu-delphi/www-covidcast/issues/665)) Add HRR Population data and fix Orlando bug

# Release 1.11.1

## Signal Changes

- Removed "COVID Symptom Searches on Google" signal.
- Replaced "COVID-Related Doctor Visits" with new signal from Change Healthcare. For more details see: [`smoothed_outpatient_cli`](https://cmu-delphi.github.io/delphi-epidata/api/covidcast-signals/chng.html)

# Release 1.11.0

This release changes COVIDcast from a complete site to an embedded component, primarily to the [www-main](https://github.com/cmu-delphi/www-covidcast) repository, which serves the Delphi homepage. This means that instead of having both covidcast.cmu.edu and delphi.cmu.edu separately, we will now have delphi.cmu.edu and covidcast will live at delphi.cmu.edu/covidcast.

The are only minor changes to the COVIDcast visualization itself, which was why this is marked as 1.11.0 instead of 2.0.

## Signal Changes

- "COVID Searches on Google" is now "COVID Symptom Searches on Google". For more details see: [`google-symptoms` `sum_anosmia_ageusia_smoothed_search`](https://cmu-delphi.github.io/delphi-epidata/api/covidcast-signals/google-symptoms.html) signal.
- New "Bar Visits" signal from Safegraph. For more details see: [`safegraph` `bars_visit_num` and `bars_visit_prop`](https://cmu-delphi.github.io/delphi-epidata/api/covidcast-signals/safegraph.html#safegraph-weekly-patterns).
- New "Restaurant Visits" signal from Safegraph. For more details see: [`safegraph` `restaurants_visit_num` and `restaurants_visit_prop`](https://cmu-delphi.github.io/delphi-epidata/api/covidcast-signals/safegraph.html#safegraph-weekly-patterns)
- "Away from home" signals replaced by smoothed versions to remove the weekend effect. For more details see: [`safegraph` `full_time_work_prop_7dav` and `part_time_work_prop_7dav`](https://cmu-delphi.github.io/delphi-epidata/api/covidcast-signals/safegraph.html#safegraph-social-distancing-metrics)

## New features

- [#610](https://github.com/cmu-delphi/www-covidcast/pull/610) (re: [#593](https://github.com/cmu-delphi/www-covidcast/issues/593)) Hospital referal regions now available as a geo type
- [#636](https://github.com/cmu-delphi/www-covidcast/pull/636) (re: [#631](https://github.com/cmu-delphi/www-covidcast/issues/631)) Change to embedded version

## Improvements

- [#629](https://github.com/cmu-delphi/www-covidcast/pull/629) (re: [#599](https://github.com/cmu-delphi/www-covidcast/issues/599)) Additional export infos
- [#650](https://github.com/cmu-delphi/www-covidcast/pull/650) (re: [#649](https://github.com/cmu-delphi/www-covidcast/issues/649)) Research disclaimer
- [#628](https://github.com/cmu-delphi/www-covidcast/pull/628) (re: [#624](https://github.com/cmu-delphi/www-covidcast/issues/624)) Limit add another to same geo level
- [#630](https://github.com/cmu-delphi/www-covidcast/pull/630) (re: [#598](https://github.com/cmu-delphi/www-covidcast/issues/598)) Restore focus upon dialog close
- [#587](https://github.com/cmu-delphi/www-covidcast/pull/587) (re: [#460](https://github.com/cmu-delphi/www-covidcast/issues/460), and others) Generate changelog from PRs
- [#653](https://github.com/cmu-delphi/www-covidcast/pull/653) More robust missing meta data handling
- [#633](https://github.com/cmu-delphi/www-covidcast/pull/633) (re: [#625](https://github.com/cmu-delphi/www-covidcast/issues/625)) Improve detail view (axis) labels
- [#641](https://github.com/cmu-delphi/www-covidcast/pull/641) (re: [#623](https://github.com/cmu-delphi/www-covidcast/issues/623)) Preserve modified date range while DetailView is displayed.
- [#575](https://github.com/cmu-delphi/www-covidcast/pull/575) (re: [#569](https://github.com/cmu-delphi/www-covidcast/issues/569)) Improve whitespace for small multiples
- [#588](https://github.com/cmu-delphi/www-covidcast/pull/588) (re: [#586](https://github.com/cmu-delphi/www-covidcast/issues/586)) Improve hover behavior on charts
- [#614](https://github.com/cmu-delphi/www-covidcast/pull/614) (re: [#589](https://github.com/cmu-delphi/www-covidcast/issues/589)) Render line chart with clipped regions.
- [#454](https://github.com/cmu-delphi/www-covidcast/pull/454) Create staging environment setup
- [#604](https://github.com/cmu-delphi/www-covidcast/pull/604) Add testing environment
- [#591](https://github.com/cmu-delphi/www-covidcast/pull/591) Improve vega tooltip styling
- [#585](https://github.com/cmu-delphi/www-covidcast/pull/585) (re: [#582](https://github.com/cmu-delphi/www-covidcast/issues/582)) Possible fix for single region vega
- [#573](https://github.com/cmu-delphi/www-covidcast/pull/573) (re: [#484](https://github.com/cmu-delphi/www-covidcast/issues/484)) Improve chart headers and layout

## Bug-fixes

- [#635](https://github.com/cmu-delphi/www-covidcast/pull/635) Date range initial selection was lost
- [#605](https://github.com/cmu-delphi/www-covidcast/pull/605) (re: [#602](https://github.com/cmu-delphi/www-covidcast/issues/602), [#603](https://github.com/cmu-delphi/www-covidcast/issues/603)) County name generation
- [#652](https://github.com/cmu-delphi/www-covidcast/pull/652) (re: [#637](https://github.com/cmu-delphi/www-covidcast/issues/637)) Reduce layout flicker on Region Details
- [#654](https://github.com/cmu-delphi/www-covidcast/pull/654) Style: fix some of the most obvious uikit bugs
- [#643](https://github.com/cmu-delphi/www-covidcast/pull/643) (re: [#586](https://github.com/cmu-delphi/www-covidcast/issues/586)) Avoid flickering tooltips on small multiples
- [#638](https://github.com/cmu-delphi/www-covidcast/pull/638) Bugfix: detecting proper death signal
- [#617](https://github.com/cmu-delphi/www-covidcast/pull/617) (re: [#615](https://github.com/cmu-delphi/www-covidcast/issues/615)) Use correct field when computing max of values.
- [#613](https://github.com/cmu-delphi/www-covidcast/pull/613) (re: [#611](https://github.com/cmu-delphi/www-covidcast/issues/611)) Fix tooltip for calendar option
- [#608](https://github.com/cmu-delphi/www-covidcast/pull/608) (re: [#607](https://github.com/cmu-delphi/www-covidcast/issues/607)) Fix mouseout and mouseover flickers
