<script>
  import { onMount } from 'svelte';
  import { currentRegion, currentSensor, currentLevel, currentData, sampleData, regionData } from './stores.js';
  import * as d3 from 'd3';

  // to get the value for sampleData, use $sampleData.
  // It is currently in the form of {date: , value: }

  regionData.subscribe(d => console.log(d));
  // regionData.subscribe(_ => updateGraph());
  regionData.subscribe(d => updateGraph(d));

  let el;
  let w;

  // test data - global variables for line graph
  var counties = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];
  var currentDate = new Date(2020, 3, 14);
  var test = 0;

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
  var userCharts = [];
  var currentChart = 0;

  function drawGraph() {
    let chart = new Chart();
    chart.draw();
    userCharts.push(chart);
  }

  function updateGraph(data) {
    console.log('update');
    if (userCharts != undefined) {
      if (userCharts[currentChart].isChart()) {
        userCharts[currentChart].draw();
      } else {
        console.log('parse data');
        var dataResults = parseData(data);
        var graphType = dataResults[0];
        var graphData = dataResults[1];
        userCharts[currentChart] = new Chart(graphType, graphData);
        console.log('debug: ' + userCharts[currentChart].isChart());
        userCharts[currentChart].draw();
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
    console.log('data: ' + data);
    for(var i=0; i<data.length; i++) {
      console.log(data[i].time_value);
    }

    // todo: finish parsing data

    // todo: determine chart type based on data
    var cType = lineGraph;
    return [cType, data];
  }

  class Chart {
    constructor(chartType, data) {
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
          console.log('debug: ' + chart.getData());
          break;
        default:
          TypeError('Chart type not a valid type.');
      }
      return chart;
    }

    setData(data) {
      console.log('set data')
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
        .call(d3.axisBottom(this.x));
      svg.append('g').call(d3.axisLeft(this.y));
    }

    updateChart() {}
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

      // construct the x and y domain from the data
      this.x.domain(
        this.getData().map(function(d) {
          return d.date;
        }),
      );
      this.y.domain([
        0,
        d3.max(this.getData(), function(d) {
          return d.value;
        }),
      ]);

      // fill in the bar chart according to the data
      svg
        .selectAll('bar')
        .data(this.data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', function(d) {
          return this.x(d.date);
        })
        .attr('width', this.x.bandwidth())
        .attr('y', function(d) {
          return this.y(d.value);
        })
        .attr('height', function(d) {
          return height - this.y(d.value);
        });

      // draw axes
      // svg.append('g')
      //     .attr('transform', 'translate(0,' + height + ')')
      //     .call(d3.axisBottom(x));
      // svg.append('g')
      //     .call(d3.axisLeft(y));
    }
  }

  class LineGraph extends Chart {
    draw() {
      // if there is an existing chart, remove it and redraw
      d3.select(el)
        .selectAll('*')
        .remove();

      // line graph
      // sampleData.subscribe(_ => {
      //   let data = $sampleData;
        let myData = this.getData();
        console.log('my data: ' + myData);
        // size chart
        var margin = { top: 20, right: 20, bottom: 70, left: 40 },
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

        var x = d3
          .scaleTime()
          .domain(d3.extent(myData, d => d.time_value))
          .range([0, width]);
        var y = d3
          .scaleLinear()
          .domain([0, 0.25])
          .range([height, 0]);

        svg
          .append('g')
          .attr('transform', 'translate(0,' + height + ')')
          .call(d3.axisBottom(x));
        svg.append('g').call(d3.axisLeft(y));

        let line = d3
          .line()
          .x(d => x(d.time_value))
          .y(d => y(+d.value));

        svg
          .append('path')
          // .attr("class", "line")
          .attr('fill', 'none')
          .attr('stroke', 'red')
          .attr('d', line(myData));

        // label lines by county
        // data.forEach(function(d) {
        //   //   var color = counties.indexOf(d.county);
        //   if (d.date.getTime() == currentDate.getTime()) {
        //     svg
        //       .append('text')
        //       .attr('transform', 'translate(' + (width + 3) + ',' + y(d.value) + ')')
        //       .style('font-size', '10px')
        //       .text(d.county);
        //   }
        // });
      // });
    }
  }

  // todo: display user friendly names on graph
  function displayName() {}
</script>

<p>COVIDCAST Data</p>
<p>
  currently viewing sensor
  <b>{$currentSensor}</b>
  at the
  <b>{$currentLevel}</b>
  level
  <!-- <b>{$selectedRegion}</b> -->
</p>

<!-- bind:this sets the variable el to the HTML div you can then select using d3 as above-->
<div bind:clientWidth={w}>
  <div bind:this={el} />
</div>
