---
title: About Our Data and Methodology
---

The COVID-19 indicators visualized on our map are derived from the data sources described below. These are all publicly available on the [COVIDcast endpoint](https://cmu-delphi.github.io/delphi-epidata/api/covidcast.html) of our public [Epidata API](https://cmu-delphi.github.io/delphi-epidata/api/README.html). The API documentation includes [full technical detail](https://cmu-delphi.github.io/delphi-epidata/api/covidcast_signals.html) on how these indicators are calculated.


## Active Indicators 

{{<indicators category="active" >}}

##  Official Reports 

{{<indicators category="official" >}}

## Paused and Retired Indicators

{{<indicators category="archived" >}}

## About Our Methodology

Full technical documentation on the sources of our data, and how our estimates are constructed, is available in the [COVIDcast API data source documentation](https://cmu-delphi.github.io/delphi-epidata/api/covidcast_signals.html).

### Live Estimates

The real-time COVID-19 indicators presented on the COVIDcast site represent our *best estimates given all data that we have available up until now*.  For example, the estimates on our site for April 24, 2020 represent our current best estimate of the indicator values for that day.  The first estimates for the indicator values for April 24 would typically be available on April 25 (one day later), but estimates for these April 24 values may be updated on later days as new data becomes available.  This phenomenon is particularly prominent with the Doctor Visits indicator, which is based on doctor’s visits that do or do not involve COVID-like illnesses: there is generally a lag in how some of the data is made available to us, and a large fraction of doctor’s visits on any day is only reported to us several days later.  For that reason, our Doctor Visits estimates that are just a few days old may be less reliable. When we deem them too unreliable, we do not post them, which is why this indicator is often available only up until a few days before the current day.

### Smoothing

For each indicator, our estimates are formed using data smoothing techniques.  The individual smoothing technique differs based on the indicator, but in all cases, we perform some kind of data smoothing (akin to averaging, or weighted averaging) across an approximately one week window.  


### Missing Estimates

Generally, we do not report estimates at locations with insufficient data (or insufficiently recent data).  The Search Trends indicator is not available at the county level, as data is only available at a coarser geographic resolution in the first place.  For the Doctor Visits and Facebook Surveys indicators, we lump together all counties in a given state that do not have sufficient data for their own individual estimate, and create a “rest of state” estimate that includes all of them.


### Intensity Heat map

The “Intensity” view presents a heat map of these estimates.  For each indicator, we use a fixed range of values, from a “low” value to a “high” value, and assign a color to each value in between, as shown to the left of the map.  These “low” and “high” values are different for each indicator, but for a given indicator, they are constant across time and geographic hierarchy, meaning that the heat maps are comparable across days.  At the county level, the “rest of state” estimates are plotted in semi-transparent colors, to make the individual counties where estimates are made more easily visually distinguishable.

### 7-day Trend Map

The “7-day Trend” view presents a color map of the trend underlying these estimates.  This is computed by calculating the line of best fit (as measured by squared error) over the last 7 days.  So for example, the trend on April 7 is based on the line of best fit through the estimates from April 1 through April 7.  We then perform a basic statistical test to determine whether this line is significantly rising or falling.  


### Correlation Analyses

Empirically (analyses conducted as of late April), we find that each of our COVID-19 indicators, averaged over a 1 week period, has a reasonably strong positive correlation (in particular, Spearman correlation, which measures correlation on the scale of ranks and is thus invariant to monotone transformations) with the number of COVID-19 cases confirmed during that same week, as made available through the JHU CSSE COVID-19 GitHub repository.  The incidence of confirmed COVID-19 cases is arguably viewed as “the standard” metric for current COVID-19 activity (albeit flawed because it is confounded by issues like testing capacity and policy), so this is a reassuring finding.  An R notebook which explicitly computes these correlations (and is completely self-contained, able to be re-compiled by any user with access to R and RStudio) is available [here](https://cmu-delphi.github.io/covidcast/R-notebooks/signal_correlations.html).  


## Release Log

{{<releasenotes>}}