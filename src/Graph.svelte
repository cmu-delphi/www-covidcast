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
  } from './stores.js';
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
    regionData.subscribe(d => updateGraph(d));
    regionDataStats.subscribe(d => setChartRange(d));
    currentDate.subscribe(_ => updateGraphTimeRange());
    currentRegion.subscribe(region => {
      ////console.log(region);
      if (!region) {
        let chart = new Chart();
        chart.draw();
        userCharts = [];
        userCharts.push(chart);
      }
    });
    currentSensor.subscribe(_ => {
      ////console.log(_);
      if (userCharts != undefined) {
        if (userCharts[currentChart].isChart()) {
          ////console.log('is chart');
          userCharts[currentChart].getChartTitle();
        } else {
          let chart = new Chart();
          chart.getChartTitle();
          chart.draw();
          userCharts = [];
          userCharts.push(chart);
        }
      }
    });
    // currentDataReadyOnMay.subscribe(d => setFocus());
    // regionDataStats.subscribe(d => ////console.log(d));
  });

  function drawGraph() {
    let chart = new Chart();
    chart.draw();
    userCharts.push(chart);
  }

  function updateGraph(data) {
    ////console.log(data);
    ////console.log($currentRegion);
    try {
      if (data.length !== 0 && $currentRegion) {
        if (userCharts != undefined) {
          if (userCharts[currentChart].isChart()) {
            userCharts[currentChart].draw();
          } else {
            var dataResults = parseData(data);
            var graphType = dataResults[0];
            var graphData = dataResults[1];
            var range = dataResults[2];
            var n = dataResults[3];
            userCharts[currentChart] = new Chart(graphType, graphData, range, n);
            userCharts[currentChart].draw();
          }
        }
      }
    } catch (err) {
      ////console.log(err);
    }
  }

  function updateGraphTimeRange() {
    if (userCharts[currentChart]) {
      userCharts[currentChart].draw();
    }
  }

  // parse data
  function parseData(clickedData) {
    let data = clickedData;

    var dataRange = userCharts[currentChart].getRange();
    var n = userCharts[currentChart].getN();
    var cType = lineGraph;
    return [cType, data, dataRange, n];
  }

  function setChartRange(data) {
    ////console.log(data);
    try {
      if (data) {
        // ////console.log('data: ' + data);
        let { min_value, max_value } = data;
        let { num_locations } = data;
        // ////console.log(num_locations);
        let stats = $regionDataStats;
        // ////console.log('data: ' + data[0]);
        // ////console.log('stats: ' + stats);
        // let min = dataStats.min_value;
        // let max = dataStats.max_value;
        // ////console.log(currentChart);
        if (userCharts[currentChart] !== undefined) {
          userCharts[currentChart].setRange(min_value, max_value);
          userCharts[currentChart].setN(num_locations);
        }
      }
    } catch (error) {
      ////console.log(error);
    }
  }

  class Chart {
    constructor(chartType, data, dataRange, num) {
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
      } else {
        ////console.log('n: ' + this.n);
      }
    }

    getYAxis() {
      let title = '';
      let sensor = $currentSensor;
      switch (sensor) {
        case 'google-survey':
          title = 'Percentage';
          break;
        case 'fb-survey':
          title = 'Percentage';
          break;
        case 'quidel':
          title = 'Percentage';
          break;
        case 'ght':
          title = 'Relative Frequency';
          break;
        case 'doctor-visits':
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
        case 'google-survey':
          format = d => d + '%';
          break;
        case 'fb-survey':
          format = d => d + '%';
          break;
        case 'quidel':
          format = d => d + '%';
          break;
        case 'ght':
          format = d3.format('.0f');
          break;
        case 'doctor-visits':
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
          title = 'Facebook surveys reporting COVID symptoms';
          break;
        case sensorKeys['q']:
          title = 'Flu tests returning negative for flu';
          break;
        case sensorKeys['ght']:
          title = 'COVID-related Google searches';
          break;
        case sensorKeys['dr']:
          title = 'Doctor visits with COVID-like symptoms';
          break;
        default:
          ////console.log('default');
          break;
      }
      ////console.log(title);
      d3.select(t).html(title);
    }

    isChart() {
      var result = null;
      try {
        this.chartType in charts ? (result = true) : (result = false);
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

      // size chart
      var margin = { top: 5, right: 42, bottom: 50, left: 60 }, // right need to be wide enough to accommodate the tooltip
        width = w - margin.left - margin.right,
        height = 0.75 * w - margin.top - margin.bottom;

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
      var k = d3.keys(myData);
      var times = k.map(i => parseTime(myData[k[i]]['time_value']));
      var maxDate = parseTime($currentDate);
      var twoWeeks = 60 * 60 * 24 * 1000 * 7 * 2;
      var bisectDate = d3.bisector(function(d) {
        return d.time_value;
      }).right;
      var minDate = maxDate - twoWeeks;
      minDate = new Date(minDate);
      myData = myData.filter(it => parseTime(it['time_value']) <= maxDate);
      myData = myData.filter(it => parseTime(it['time_value']) > minDate);

      // set x-axis ticks based off of data sparsity and format y-axis ticks
      var xTicks = myData.length;
      var formatXTicks = xTicks < 6 ? xTicks : d3.timeDay.every(3);
      var formatYTicks = this.getFormat();

      let chartMax = this.max;
      // peg values to max and min if out of range
      for (var i = 0; i < myData.length; i++) {
        myData[i].max = false;
        if (+myData[i].value < this.min) {
          myData[i].value = this.min;
        } else if (+myData[i].value > this.max) {
          myData[i].max = true;
          // myData[i].value = this.max;
          if (+myData[i].value > chartMax) chartMax = +myData[i].value;
        }
      }
      ////console.log(chartMax);
      ////console.log(myData);

      if (chartMax > 100 && $currentSensor !== 'ght') {
        chartMax = 100;
      }

      var x = d3
        .scaleTime()
        .domain(d3.extent(myData, d => parseTime(d.time_value)))
        .range([0, width]);
      var y = d3
        .scaleLinear()
        .domain([0, chartMax])
        .range([height, 0]);

      svg
        .append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate(0,' + height + ')')
        .call(
          d3
            .axisBottom(x)
            .tickFormat(d3.timeFormat('%m/%d'))
            .ticks(formatXTicks),
        );
      svg
        .append('g')
        .attr('class', 'axis')
        .call(d3.axisLeft(y).tickFormat(formatYTicks));

      let line = d3
        .line()
        .x(d => x(parseTime(d.time_value)))
        .y(d => y(+d.value));

      svg
        .append('path')
        .attr('fill', 'none')
        .attr('stroke', DIRECTION_THEME.gradientMiddle)
        .attr('stroke-width', 3)
        .attr('d', line(myData));

      let tip = d3Tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
          return d3.timeFormat('%m/%d')(parseTime(d.time_value)) + ': ' + d.value.toFixed(2) + '%';
        });

      svg.call(tip);

      svg
        .selectAll('circle')
        .data(myData)
        .enter()
        .append('circle')
        .attr('r', 4)
        .attr('cx', d => x(parseTime(d.time_value)))
        .attr('cy', d => y(+d.value))
        .style('fill', DIRECTION_THEME.gradientMiddle)
        // .style('fill', d => (d.max ? DIRECTION_THEME.gradientMax : DIRECTION_THEME.gradientMiddle))
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);

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
        .attr('transform', 'translate(' + width / 2 + ', ' + (height + margin.top + 30) + ')')
        .style('text-anchor', 'middle')
        .text('Date');

      // label the chart
      this.getChartTitle();
      var chartTitle = this.getChartTitle();
      svg
        .append('text')
        .attr('transform', 'translate(' + width / 2 + ', ' + 0 + ')')
        .style('text-anchor', 'middle')
        .text(chartTitle);
    }
  }

  function calculateValFromRectified(rectified) {
    let tempDate = new Date(rectified);
    let year = tempDate.getFullYear();
    let month = ('0' + (tempDate.getMonth() + 1)).slice(-2);
    let date = ('0' + tempDate.getDate()).slice(-2);
    return year + month + date;
  }

  function calculateSD() {
    let sensor = $currentSensor;
    let sts = $stats.get(sensor);
    var minMax = [sts.mean - 3 * sts.std, sts.mean + 3 * sts.std];
    if (minMax[0] < 0) {
      minMax[0] = 0;
    }
    userCharts[currentChart].setRange(minMax[0], minMax[1]);
  }

  function dataDescription() {}
</script>

<style>
  .graph-title {
    text-align: center;
    font-size: 14px;
    margin: 3px 0px !important;
    padding: 0px !important;
  }
  .graph-description {
    text-align: center;
    margin: 5px 0px 7px 0px !important;
    font-size: 14px;
    font-style: italic;
    padding: 0px !important;
  }
</style>

<div class="graph-container">
  <h5 bind:this={t} class="graph-title" />
  <p class="graph-description">
    {$currentRegionName} {$currentRegionName && $currentLevel === 'county' ? 'County' : ''}
  </p>

  <div bind:clientWidth={w}>
    <div bind:this={el} />
  </div>
</div>
