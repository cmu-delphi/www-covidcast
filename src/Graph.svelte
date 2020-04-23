<script>
  import { onMount } from 'svelte';
  import {
    currentRegion,
    currentRegionName,
    currentSensor,
    currentLevel,
    currentData,
    regionData,
    regionDataStats,
    currentSensorName,
    currentLevelName,
    currentDate,
    times,
    stats,
    sensors,
    signalType,
    timeRangeOnSlider,
  } from './stores.js';
  import { calculateValFromRectified } from './util.js';
  import { DIRECTION_THEME } from './theme.js';
  import * as d3 from 'd3';
  import d3Tip from 'd3-tip';

  let el;
  let w;
  let t;

  // local variables for permissible graph types
  const barChart = 'Bar_Chart';
  const lineGraph = 'Line_Graph';
  const charts = [barChart, lineGraph];
  let userCharts = [];
  let currentChart = 0;
  let sensorKeys = {
    dr: 'doctor-visits',
    fb: 'fb-survey',
    google: 'google-survey',
    ght: 'ght',
    q: 'quidel',
  };

  onMount(_ => {
    drawGraph();
    // console.log('on mount called');
    regionData.subscribe(d => updateGraph(d));
    regionDataStats.subscribe(d => setChartRange(d));
    currentDate.subscribe(_ => updateGraphTimeRange());
    signalType.subscribe(_ => updateGraph($regionData));
    currentRegion.subscribe(region => {
      // console.log('current region changed: ' + region);
      if (!region) {
        userCharts[currentChart].setData([]);
        userCharts[currentChart].draw();
      }
    });
    currentLevel.subscribe(_ => {
      // console.log('level changed:' + $currentLevel);
    });
    currentSensor.subscribe(_ => {
      // console.log('current sensor changed: ' + $currentSensor);
      if (userCharts != undefined) {
        if (userCharts[currentChart].isChart()) {
          // console.log('is chart-current sensor, increment: ' + currentChart);
          userCharts[currentChart].getChartTitle();
        } else {
          // console.log('is chart fail: ' + userCharts[currentChart].isChart());
          // console.log($currentSensor);
          let chart = new Chart();
          chart.getChartTitle();
          chart.draw();
          userCharts.push(chart);
          currentChart += 1;
          // console.log('new chart-current sensor, increment: ' + currentChart);
        }
      }
    });
    timeRangeOnSlider.subscribe(({ min, max }) => {
      if (userCharts != undefined) {
        setChartDomain(min, max);
        userCharts[currentChart].draw();
      }
    });
  });

  function drawGraph() {
    let chart = new Chart();
    chart.draw();
    userCharts.push(chart);
    // console.log('new chart-draw graph, increment' + currentChart);
  }

  function updateGraph(data) {
    // console.log('update graph');
    try {
      if (data.length !== 0 && $currentRegion) {
        if (userCharts != undefined) {
          if (userCharts[currentChart].isChart()) {
            userCharts[currentChart].draw();
          } else {
            var dataResults = transferData(data);
            var graphType = dataResults[0];
            var graphData = dataResults[1];
            var range = dataResults[2];
            var n = dataResults[3];
            var domain = dataResults[4];
            userCharts[currentChart] = new Chart(graphType, graphData, range, n, domain);
            userCharts[currentChart].draw();
          }
        }
      }
    } catch (err) {}
  }

  function updateGraphTimeRange() {
    if (userCharts[currentChart]) {
      userCharts[currentChart].draw();
    }
  }

  // transfer data to new graph
  function transferData(clickedData) {
    let data = clickedData;
    var dataRange = userCharts[currentChart].getRange();
    var n = userCharts[currentChart].getN();
    var domain = userCharts[currentChart].getDomain();
    var cType = lineGraph;
    return [cType, data, dataRange, n, domain];
  }

  function setChartRange(data) {
    ////console.log(data);
    try {
      if (data) {
        let { min_value, max_value } = data;
        let { num_locations } = data;
        let stats = $regionDataStats;
        if (userCharts[currentChart] !== undefined) {
          userCharts[currentChart].setRange(min_value, max_value);
          userCharts[currentChart].setN(num_locations);
        }
      }
    } catch (error) {}
  }

  function setChartDomain(min, max) {
    try {
      if (userCharts[currentChart] != undefined) {
        let minDate = min;
        let maxDate = max;
        userCharts[currentChart].setDomain(min, max);
      }
    } catch (e) {}
  }

  class Chart {
    constructor(chartType, data, dataRange, num, domain) {
      var chart;
      this.chartType = chartType;
      this.x = null;
      this.y = null;
      switch (chartType) {
        case 'Bar_Chart':
          chart = new BarChart();
          chart.setData(data);
          break;
        case 'Line_Graph':
          chart = new LineGraph();
          chart.setData(data);
          chart.setRange(dataRange[0], dataRange[1]);
          chart.setN(num);
          chart.setDomain(domain[0], domain[1]);
          break;
        default:
          TypeError('Chart type not a valid type.');
      }
      return chart;
    }

    setData(data) {
      // this.verifyDataFormat(data);
      // if(this.data === null) {
      this.data = data;
      // } else {
      //   new Error('Cannot set data. Data already set. Use update method to change values.');
      // }
    }

    getData() {
      return this.data;
    }

    setN(num) {
      this.n = num;
    }

    getN() {
      if (this.n) {
        return this.n;
      }
    }

    getYAxis() {
      let title = '';
      let sensor = $currentSensor;
      switch (sensor) {
        case sensorKeys['google']:
          title = 'Percentage';
          break;
        case sensorKeys['fb']:
          title = 'Percentage';
          break;
        case sensorKeys['q']:
          title = 'Tests per device';
          break;
        case sensorKeys['ght']:
          title = 'Relative frequency';
          break;
        case sensorKeys['dr']:
          title = 'Percentage';
          break;
        default:
          break;
      }
      return title;
    }

    getFormat() {
      let sensor = $currentSensor;
      var format = '';
      switch (sensor) {
        case sensorKeys['google']:
          format = d => d + '%';
          break;
        case sensorKeys['fb']:
          format = d => d + '%';
          break;
        case sensorKeys['q']:
          format = d3.format('.0f');
          break;
        case sensorKeys['ght']:
          format = d3.format('.0f');
          break;
        case sensorKeys['dr']:
          format = d => d + '%';
          break;
        default:
          break;
      }
      return format;
    }

    getChartTitle() {
      let sensor = $currentSensor;
      let title = '';
      switch (sensor) {
        // ////console.log(sensorKeys['google']);
        case sensorKeys['google']:
          title = 'Google surveys reporting COVID symptoms in the community';
          break;
        case sensorKeys['fb']:
          title = 'Surveys via Facebook reporting COVID symptoms in household';
          break;
        case sensorKeys['q']:
          title = 'Influenza testing demand';
          break;
        case sensorKeys['ght']:
          title = 'COVID-related Google searches';
          break;
        case sensorKeys['dr']:
          title = 'Doctor visits with COVID-like symptoms';
          break;
        default:
          break;
      }
      d3.select(t).html(title);
    }

    isChart() {
      // console.log(this.chartType);
      var result = null;
      try {
        this.chartType in charts ? (result = true) : (result = false);
        // console.log(this.chartType in charts);
      } catch (e) {
        if (e.name == 'ReferenceError') {
          result = false;
        }
      }
      return result;
    }

    verifyDataFormat() {}

    draw() {
      // if there is an existing chart, remove it and redraw
      d3.select(el)
        .selectAll('*')
        .remove();

      // size chart
      var margin = { top: 20, right: 20, bottom: 70, left: 40 },
        width = w - margin.left - margin.right,
        height = 0.75 * w - margin.top - margin.bottom;

      // parse the date time
      var parseDate = d3.timeParse('%Y%m%d');

      // set ranges
      this.x = d3.scaleBand().rangeRound([0, width]);
      this.y = d3.scaleLinear().range([height, 0]);

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
        .call(d3.axisBottom(this.x).tickFormat(''));
      svg.append('g').call(d3.axisLeft(this.y).tickFormat(''));
    }

    updateChart() {}

    setRange(min, max) {
      this.min = min;
      this.max = max;
    }

    getRange() {
      return [this.min, this.max];
    }

    setDomain(minDate, maxDate) {
      this.minDate = minDate;
      this.maxDate = maxDate;
    }

    getDomain() {
      //console.log('get domain: ' + this.minDate);
      return [this.minDate, this.maxDate];
    }
    updateAxes() {}
  }

  class BarChart extends Chart {
    // verify that the supplied data is an array of integers for a single data source
    verifyDataFormat(data) {
      super.verifyDataFormat();
      !Number.isInteger(Object.values(data))
        ? TypeError('Provided data is of the wrong type. Only integers accepted.')
        : true;
      data.length > 1
        ? RangeError('Bar charts are only valid for single data sources. Comparisons are not supported.')
        : true;
      data.length < 1 ? ReferenceError('No data was provided.') : true;
    }

    draw() {
      super.draw();
    }
  }

  class LineGraph extends Chart {
    draw() {
      // test function
      calculateSD();

      // if there is an existing chart, remove it and redraw
      d3.select(el)
        .selectAll('*')
        .remove();

      // line graph
      let myData = this.getData();
      // console.log('my data:' + myData[0]);

      // size chart
      var margin = { top: 15, right: 42, bottom: 70, left: 60 }, // right need to be wide enough to accommodate the tooltip
        width = w - margin.left - margin.right,
        height = 0.85 * w - margin.top - margin.bottom;

      d3.select(el).html('');
      var svg = d3
        .select(el)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      // set date range
      var parseTime = d3.timeParse('%Y%m%d');
      var domain = this.getDomain();
      var minDate = parseTime(domain[0]);
      var maxDate = parseTime(domain[1]);
      var bisectDate = d3.bisector(function(d) {
        return d.time_value;
      }).right;
      myData = myData.filter(it => parseTime(it['time_value']) <= maxDate);
      myData = myData.filter(it => parseTime(it['time_value']) >= minDate);

      // set x-axis ticks based off of data sparsity and format y-axis ticks
      var xTicks = myData.length;
      // var formatXTicks = xTicks < 6 ? d3.timeDay.every(1) : d3.timeDay.every(5);
      // formatXTicks = xTicks > 40 ? d3.timeDay.every(5) : d3.format(10);
      // var formatXTicks = 8;
      console.log('format: ' + formatXTicks);

      var formatYTicks = this.getFormat();

      let currDate = parseTime($currentDate);
      let currDateSeven = parseTime($currentDate);
      currDateSeven.setDate(currDate.getDate() - 6);

      // peg values to max and min if out of range
      let chartMax = this.max;
      let chartMin = this.min;
      for (var i = 0; i < myData.length; i++) {
        let directionDate = parseTime(myData[i].time_value);
        if (directionDate >= currDateSeven && directionDate <= currDate) {
          myData[i].inDirection = true;
        } else {
          myData[i].inDirection = false;
        }
        myData[i].max = false;
        if (+myData[i].value < this.min) {
          myData[i].value = this.min;
        } else if (+myData[i].value > this.max) {
          myData[i].max = true;
          if (+myData[i].value > chartMax) chartMax = +myData[i].value;
        }
      }

      if (chartMax > 100 && $currentSensor !== 'ght' && $currentSensor !== 'quidel') {
        // console.log('seeting max');
        chartMax = 100;
      }

      // scale x and y axes
      var x = d3
        .scaleTime()
        .domain(d3.extent(myData, d => parseTime(d.time_value)))
        .range([0, width]);
      var y = d3
        .scaleLinear()
        .domain([this.min, chartMax])
        .range([height, 0]);

      var formatXTicks = xTicks < 6 ? d3.timeDay.every(1) : d3.timeDay.every(4);
      // var formatXTicks = xTicks < 6 ? d3.timeDay.every(1) : d3.timeDay.every(5);
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
        .attr('y', 10)
        .attr('x', -20)
        .attr('dy', '0em')
        .attr('transform', 'rotate(-60)');

      svg
        .append('g')
        .attr('class', 'axis')
        .call(d3.axisLeft(y).tickFormat(formatYTicks));

      // draw the line graph
      let line = d3
        .line()
        .x(d => x(parseTime(d.time_value)))
        .y(d => y(+d.value));

      svg
        .append('path')
        .attr('fill', 'none')
        .attr('stroke', '#767676') // DIRECTION_THEME.gradientMiddle)
        .attr('stroke-width', 3)
        .attr('d', line(myData));

      // define tool tip
      let tip = d3Tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
          return (
            d3.timeFormat('%m/%d')(parseTime(d.time_value)) +
            ': ' +
            d.value.toFixed(2) +
            ($currentSensor === sensorKeys['ght'] || $currentSensor === sensorKeys['q'] ? '' : '%')
          );
        });

      svg.call(tip);

      svg
        .selectAll('circle')
        .data(myData)
        .enter()
        .append('circle')
        .attr('r', d => (d.time_value == $currentDate ? 6 : 4))
        .attr('cx', d => x(parseTime(d.time_value)))
        .attr('cy', d => y(+d.value))
        .attr('id', d => d.time_value)
        .style('stroke-width', d => (d.time_value == $currentDate ? 1 : 1))
        .style('fill', d => {
          let color = '#767676';
          if (d.inDirection && $signalType === 'direction') {
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
          } else if (d.time_value == $currentDate && $signalType === 'value') {
              color = 'white';
          }
          return color;
        })
        .style('stroke', '#767676')
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);
      myData.map(d => console.log(d));

      // var colorScale = d3.scaleLinear()
      //                     .domain([chartMin, chartMax])
      //                     .range([gradientMin, gradientMiddle, gradientMax])
      //                     .interpolate(d3.interpolateHcl);
      // svg.select('#'+$currentDate)
      //   .enter()
      //   .style('fill', d => {colorScale(d.value)});
            // else if(d.time_value == $currentDate && $signalType === 'value') {
            //             color = colorScale(d.value);
            //           }
            // add the data to the graph
         //d => (d.time_value == $currentDate ? DIRECTION_THEME.gradientMiddle : 'none'))

      //d => (d.time_value == $currentDate ? DIRECTION_THEME.gradientMiddle : 'none'))


      //console.log($currentRegion);
      // label the y-axis
      var label = this.getYAxis();
      svg
        .append('text')
        .attr('class', 'axis-text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0 - margin.left)
        .attr('x', 0 - height / 2)
        .attr('dy', '0.75em')
        .style('text-anchor', 'middle')
        .text(label);

      // label the x-axis
      svg
        .append('text')
        .attr('class', 'axis-text')
        .attr('transform', 'translate(' + width / 2 + ', ' + (height + margin.top + 40) + ')')
        .style('text-anchor', 'middle')
        .text('Date');

      // label the chart
      this.getChartTitle();
      var chartTitle = this.getChartTitle();
      svg
        .append('text')
        .attr('class', 'graph-title')
        .attr('transform', 'translate(' + width / 2 + ', ' + 0 + ')')
        .style('text-anchor', 'middle')
        .text(chartTitle);
    }
  }

  // calculate the graph's min and max range based off the dataset's standard deviation
  function calculateSD() {
    let sensor = $currentSensor;
    let sts = $stats.get(sensor);
    var minMax = [sts.mean - 3 * sts.std, sts.mean + 3 * sts.std];
    if (minMax[0] < 0) {
      minMax[0] = 0;
    }
    userCharts[currentChart].setRange(minMax[0], minMax[1]);
  }
</script>

<style>
  .graph {
    max-height: 370px;
    max-width: 400px;
  }

  .graph-title {
    text-align: center;
    font-size: 14px;
    margin: 3px 0px !important;
    padding: 0px !important;
    font-family: 'Open Sans', sans-serif;
    color: var(--darkgrey);
  }

  .graph-description {
    text-align: center;
    margin: 3px 0px 3px 0px !important;
    font-size: 14px;
    padding: 0px !important;
  }

  .graph-itself {
    margin: 0px 6px;
    width: 374px;
  }
</style>

<div class="graph">
  <h5 bind:this={t} class="graph-title" />
  <p class="graph-description">
    {$currentRegionName && $currentLevel === 'county' && $currentRegion.slice(-3) + '' === '000' ? 'Rest of' : ''}
    {$currentRegionName}
    {$currentRegionName && $currentLevel === 'county' && $currentRegion.slice(-3) + '' !== '000' ? 'County' : ''}
    {$currentRegionName && $currentLevel === 'msa' ? 'Metro Area' : ''}
  </p>

  <div bind:clientWidth={w} class="graph-itself">
    <div bind:this={el} />
  </div>
</div>
