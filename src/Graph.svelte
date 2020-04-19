<script>
  import { onMount } from 'svelte';
  import {
    currentRegion,
    currentSensor,
    currentLevel,
    currentData,
    regionData,
    regionDataStats,
    currentSensorName,
    currentLevelName,
    currentDataReadyOnMay,
  } from './stores.js';
  import * as d3 from 'd3';

  let el;
  let w;

  // the $ syntax just says, if w is changed, run drawGraph() - e.g. redraw the graph when the window is resized.
  // $: w, drawGraph();

  // This subscribes to sample data to redraw the graph every time the data changes.
  // todo: fix current region subscription
  // currentRegion.subscribe(_ => updateGraph());
  onMount(_ => drawGraph());

  // local variables for permissible graph types
  const barChart = 'Bar_Chart';
  const lineGraph = 'Line_Graph';
  const charts = [barChart, lineGraph];
  let userCharts = [];
  let currentChart = 0;

  regionData.subscribe(d => updateGraph(d));
  regionDataStats.subscribe(d => setChartRange(d));
  // currentDataReadyOnMay.subscribe(d => setFocus());
  // regionDataStats.subscribe(d => console.log(d));

  function drawGraph() {
    let chart = new Chart();
    chart.draw();
    userCharts.push(chart);
  }

  function updateGraph(data) {
    if (data.length !== 0) {
      if (userCharts != undefined) {
        if (userCharts[currentChart].isChart()) {
          userCharts[currentChart].draw();
        } else {
          var dataResults = parseData(data);
          var graphType = dataResults[0];
          var graphData = dataResults[1];
          var range = dataResults[2];
          userCharts[currentChart] = new Chart(graphType, graphData, range);
          userCharts[currentChart].draw();
        }
      }
    }
  }

  // parse data
  function parseData(clickedData) {
    let data = clickedData;
    // let region = $currentRegion;

    // search for the ID
    // let re = new RegExp('US[0-9]+');
    // let geo = region.match(re);
    // console.log('region data: ' + geo);
    // console.log('data: ' + data);
    // for (var i = 0; i < data.length; i++) {
    //   console.log(data[i].time_value);
    // }

    // todo: finish parsing data

    // todo: determine chart type based on data
    var dataRange = userCharts[currentChart].getRange();
    var cType = lineGraph;
    return [cType, data, dataRange];
  }

  function setChartRange(data) {
    if (data) {
      let { min_value, max_value } = data;
      // let stats = $regionDataStats;
      // console.log('stats: ' + stats);
      // let min = dataStats.min_value;
      // let max = dataStats.max_value;
      // console.log(currentChart);
      if (userCharts[currentChart] !== undefined) {
        userCharts[currentChart].setRange(min_value, max_value);
      }
    }
  }

  class Chart {
    constructor(chartType, data, dataRange) {
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

    getYAxis() {
      let title = '';
      let sensor = $currentSensor;
      console.log(sensor);
      switch (sensor) {
        case 'google-survey':
          title = 'Percentage';
          break;
        case 'fb_survey':
          title = 'Percentage';
          break;
        case 'quidel':
          title = 'Percentage';
          break;
        case 'ght':
          title = 'Frequency';
          break;
        case 'doctor-visits':
          title = 'Percentage';
          break;
        default:
          break;
      }
      return title;
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
        .call(d3.axisBottom(this.x).tickFormat('%m %d'));
      svg.append('g').call(d3.axisLeft(this.y));
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
      // if there is an existing chart, remove it and redraw
      d3.select(el)
        .selectAll('*')
        .remove();

      // line graph
      let myData = this.getData();
      console.log('length: ' + myData);

      // size chart
      var margin = { top: 20, right: 20, bottom: 70, left: 60 },
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


      var parseTime = d3.timeParse('%Y%m%d');
      var formatTime = d3.timeFormat('%m-%d-%Y');
      var k = d3.keys(myData);
      var times = k.map(i => parseTime(myData[k[i]]['time_value']));
      var maxDate = Math.max.apply(null, times);
      var twoWeeks = 60*60*24*1000*7*2;
      maxDate = maxDate - twoWeeks;
      maxDate = new Date(maxDate);
      myData = myData.filter(it => (parseTime(it['time_value']) > maxDate));
      var x = d3
        .scaleTime()
        .domain(d3.extent(myData, d => parseTime(d.time_value)))
        .range([0, width]);
      var y = d3
        .scaleLinear()
        .domain([this.min, this.max*1.2])
        .range([height, 0]);

      svg
        .append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate(0,' + height + ')')
        .call(
          d3
            .axisBottom(x)
            .tickFormat(d3.timeFormat('%m/%d'))
            .ticks(d3.timeDay.every(4)),
        );
      svg
        .append('g')
        .attr('class', 'axis')
        .call(
          d3
            .axisLeft(y)
            .ticks(8)
        );

      let line = d3
        .line()
        .x(d => x(parseTime(d.time_value)))
        .y(d => y(+d.value));

      svg
        .append('path')
        .attr('fill', 'none')
        .attr('stroke', '#CB2F4A')
        .attr('stroke-width', 3)
        .attr('d', line(myData));

      // label the y-axis
      var label = this.getYAxis();
      svg
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0 - margin.left)
        .attr('x', 0 - height / 2)
        .attr('dy', '0.75em')
        .style('text-anchor', 'middle')
        .text(label);

      // label the x-axis
      svg
        .append('text')
        .attr('transform', 'translate(' + width / 2 + ', ' + (height + margin.top + 20) + ')')
        .style('text-anchor', 'middle')
        .text('Date');
    }
  }

  function setFocus() {

  }
</script>

<style>
  .graph-title {
    text-align: center;
    margin: 0px;
  }
</style>

<h4 class="graph-title">Intensity Data Over Time</h4>
<p>
  Currently viewing sensor
  <b>{$currentSensorName}</b>
  at the
  <b>{$currentLevelName}</b>
  level
  <!-- <b>{$selectedRegion}</b> -->

  <!-- bind:this sets the variable el to the HTML div you can then select using d3 as above-->
</p>
<div bind:clientWidth={w}>
  <div bind:this={el} />
</div>
