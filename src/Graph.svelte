<script>
  import { onMount } from 'svelte';
  import {
    currentRegion,
    currentRegionName,
    currentSensor,
    currentLevel,
    currentData,
    regionData,
    currentSensorName,
    currentLevelName,
    currentDate,
    times,
    stats,
    sensors,
    sensorMap,
    signalType,
    timeRangeOnSlider,
    yesterday,
    mounted,
  } from './stores.js';
  import { calculateValFromRectified } from './util.js';
  import { DIRECTION_THEME } from './theme.js';
  import * as d3 from 'd3';
  import d3Tip from 'd3-tip';

  const parseTime = d3.timeParse('%Y%m%d');

  let el;
  let w;
  let t;

  onMount(_ => {
    d3.select(el)
      .selectAll('*')
      .remove();

    if (w > 400) w = 400;

    const margin = { top: 15, right: 35, bottom: 70, left: 60 },
      width = w - margin.left - margin.right,
      height = 0.85 * w - margin.top - margin.bottom;

    // size chart

    // set ranges
    let x = d3.scaleBand().rangeRound([0, width]);
    let y = d3.scaleLinear().range([height, 0]);

    // attach graphic

    var svg = d3
      .select(el)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    // draw axes
    svg
      .append('g')
      .attr('transform', 'translate(0,' + height + ')')
      .call(d3.axisBottom(x).tickFormat(''));
    svg.append('g').call(d3.axisLeft(y).tickFormat(''));

    regionData.subscribe(d => updateGraph(d, $timeRangeOnSlider, $currentDate, $currentSensor, $signalType));
    signalType.subscribe(s => updateGraph($regionData, $timeRangeOnSlider, $currentDate, $currentSensor, s));
    timeRangeOnSlider.subscribe(r => updateGraph($regionData, r, $currentDate, $currentSensor, $signalType));
  });

  function updateGraph(data, range, date, sensor, signal) {
    if (!$mounted) return;

    // if there is an existing chart, remove it and redraw
    d3.select(el)
      .selectAll('*')
      .remove();
    d3.select(el).html('');

    const margin = { top: 15, right: 35, bottom: 70, left: 60 },
      width = w - margin.left - margin.right,
      height = 0.85 * w - margin.top - margin.bottom;

    var svg = d3
      .select(el)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    // set date range
    var minDate = parseTime(range.min);
    var maxDate = parseTime(range.max);

    data = data.filter(it => {
      let t = parseTime(it['time_value']);
      return t >= minDate && t <= maxDate;
    });

    let currDate = parseTime(date);
    let currDateSeven = d3.timeDay.offset(currDate, -7);

    // peg values to max and min if out of range
    let minMax = calculateSD(sensor);
    let chartMax = minMax[1];
    let chartMin = minMax[0];

    for (var i = 0; i < data.length; i++) {
      let directionDate = parseTime(data[i].time_value);
      if (directionDate >= currDateSeven && directionDate <= currDate) {
        data[i].inDirection = true;
      } else {
        data[i].inDirection = false;
      }
      data[i].max = false;
      if (+data[i].value < minMax[0]) {
        data[i].value = minMax[0];
      } else if (+data[i].value > minMax[1]) {
        data[i].max = true;
        if (+data[i].value > chartMax) chartMax = +data[i].value;
      }
    }

    if (chartMax > 100 && $sensorMap.get(sensor).format === 'percent') {
      chartMax = 100;
    }
    // scale x and y axes
    var x = d3
      .scaleTime()
      .domain([d3.extent(data, d => parseTime(d.time_value))[0], parseTime(yesterday)])
      .range([0, width]);
    var y = d3
      .scaleLinear()
      .domain([minMax[0], chartMax])
      .range([height, 0]);

    let formatYTicks;
    let format = $sensorMap.get(sensor).format;
    if (format === 'percent') formatYTicks = d => d + '%';
    else if (format === 'raw') {
      if (sensor.match(/num/)) {
        formatYTicks = d3.format('d');
      } else {
        formatYTicks = y.domain[1] - y.domain[0] > 10 ? d3.format('.0f') : d3.format('.1f');
      }
    }
    var formatXTicks = data.length < 6 ? d3.timeDay.every(1) : d3.timeDay.every(4);

    // append the axes
    svg
      .append('g')
      .attr('class', 'axis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(
        d3
          .axisBottom(x)
          .tickFormat(d3.timeFormat('%m/%d'))
          .ticks(7),
      );

    svg
      .selectAll('text')
      .attr('dy', '8px')
      .attr('dx', '-6px')
      .attr('transform', 'rotate(-30)');

    svg
      .append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(y).tickFormat(formatYTicks));

    // define tool tip
    let tip = d3Tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html(function(d) {
        return (
          d3.timeFormat('%m/%d')(parseTime(d.time_value)) +
          ': ' +
          (sensor.match(/num/) ? Math.round(d.value) : d.value.toFixed(2)) +
          ($sensorMap.get(sensor).format === 'percent' ? '%' : '') +
          (d.stderr ? ' ± ' + d.stderr.toFixed(2) + ($sensorMap.get(sensor).format === 'percent' ? '%' : '') : '')
        );
      });
    svg.call(tip);

    // draw the line graph
    let line = d3
      .line()
      .x(d => x(parseTime(d.time_value)))
      .y(d => y(+d.value));

    let area = d3
      .area()
      .x(d => x(parseTime(d.time_value)))
      .y0(d => y(Math.max(0, +d.value - d.stderr)))
      .y1(d => y(+d.value + d.stderr));

    svg
      .append('path')
      .attr('fill', 'none')
      .attr('stroke', '#767676')
      .attr('stroke-width', 3)
      .attr('d', line(data));

    svg
      .append('path')
      .attr('fill', 'rgba(0, 0, 0, 0.1')
      .attr('d', area(data));

    svg
      .selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('r', d => (d.time_value == date ? 6 : 4))
      .attr('cx', d => x(parseTime(d.time_value)))
      .attr('cy', d => y(+d.value))
      .attr('id', d => d.time_value)
      .style('stroke-width', d => (d.time_value == date ? 1 : 1))
      .style('fill', d => {
        let color = '#767676';
        if (d.inDirection && signal === 'direction') {
          switch (d.direction) {
            case 1:
              color = DIRECTION_THEME.increasing;
              break;
            case 0:
              color = DIRECTION_THEME.steady;
              break;
            case -1:
              color = DIRECTION_THEME.decreasing;
              break;
            default:
              color = 'white';
              break;
          }
        } else if (d.time_value == date && signal === 'value') {
          color = 'white';
        }
        return color;
      })
      .style('stroke', '#767676')
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide)
      .on('click', d => {
        tip.hide;
        d3.selectAll('.d3-tip').remove();
        currentDate.set(d.time_value);
      });

    // label the y-axis
    svg
      .append('text')
      .attr('class', 'axis-text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - height / 2)
      .attr('dy', '0.75em')
      .style('text-anchor', 'middle')
      .text($sensorMap.get(sensor).yAxis);

    // label the x-axis
    svg
      .append('text')
      .attr('class', 'axis-text')
      .attr('transform', 'translate(' + width / 2 + ', ' + (height + margin.top + 30) + ')')
      .style('text-anchor', 'middle')
      .text('Date');
  }

  // calculate the graph's min and max range based off the dataset's standard deviation
  function calculateSD(sensor) {
    let sts;
    if ($currentSensor.match(/num/)) {
      sts = $stats.get(sensor + '_' + $currentLevel);
    } else {
      sts = $stats.get(sensor);
    }
    var minMax = [sts.mean - 3 * sts.std, sts.mean + 3 * sts.std];
    if (minMax[0] < 0) {
      minMax[0] = 0;
    }
    return minMax;
  }
</script>

<style>
  .graph {
    max-height: 390px;
    max-width: 400px;
  }

  .graph-title {
    text-align: center;
    font-size: 14px;
    margin: 3px 0px !important;
    padding: 0px 20px 0px 20px !important;
    font-family: 'Open Sans', sans-serif;
    color: var(--darkgrey);
  }

  .graph-description {
    text-align: center;
    margin: 3px 20px 3px 20px !important;
    font-size: 14px;
    padding: 0px !important;
  }

  .graph-itself {
    margin: 0px 6px;
    width: 374px;
  }
</style>

<div class="graph">
  <h5 class="graph-title">{$sensorMap.get($currentSensor).chartTitleText}</h5>
  <p class="graph-description">
    {$currentRegionName && $currentLevel === 'county' && $currentRegion.slice(-3) + '' === '000' ? 'Rest of' : ''}
    {$currentRegionName}
    {$currentRegionName && $currentLevel === 'county' && $currentRegion.slice(-3) + '' !== '000' ? 'County' : ''}
  </p>

  <div bind:clientWidth={w} class="graph-itself">
    <div bind:this={el} />
  </div>
</div>
