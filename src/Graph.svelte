<script>
  import { onMount } from 'svelte';
  import { selectedRegion, currentSensor, currentLevel, currentData } from './stores.js';
  import * as d3 from 'd3';

  // to get the value for sampleData, use $sampleData.
  // It is currently in the form of {date: , value: }

  let el;
  let w;
  // the $ syntax just says, if w is changed, run drawGraph() - e.g. redraw the graph when the window is resized.
  // $: w, drawGraph();

  // This subscribes to sample data to redraw the graph every time the data changes.
  selectedRegion.subscribe(_ => updateGraph());
  onMount(_ => drawGraph());

  // local variables for permissible graph types
  const barChart = 'Bar_Chart';
  const lineGraph = 'Line_Graph';
  const charts = [barChart, lineGraph];
  var userCharts = [];
  var currentChart = 0;

  function drawGraph() {
    console.log('draw graph');
    let chart = new Chart();
    chart.draw();
    userCharts.push(chart);
  }

  function updateGraph() {
    console.log('update');
    if(userCharts != undefined) {
      var test = userCharts[currentChart].isChart(this);
      console.log(test);
      userCharts[currentChart].isChart(this) ? userCharts[currentChart].draw() : userCharts[currentChart] = new Chart(fetchData());
    }
  }

  // parse data
  function fetchData() {
    console.log('get data');
    let data = $currentData;
    let region = $selectedRegion;
    console.log('first element' + data['0']);
    console.log('region: ' + region);

    // search for the ID
    let re = new RegExp('US[0-9]+');
    let geo = region.match(re);
    // let graphData = data[geo];
    // console.log('region data: ' + geo);
    // console.log(graphData);
    // let gData = null;
    // for(var i in data) {
    //   console.log(i);
    //   if(i.geo_id == geo) { gData = i; }
    //   break;
    // }
    // let gData = $(data).filter(function(k, v) {
    //   return v.geo_id == geo;
    // });
    // console.log('filter: ' + gData);

    // todo: finish parsing data
    var graphData =   {
                    "county1" : {
                      "03-30-2020" : 20,
                      "03-31-2020" : 22,
                      "04-01-2020" : 28,
                      "04-02-2020" : 33,
                      "04-03-2020" : 45,
                      "04-04-2020" : 47,
                      "04-05-2020" : 49,
                      "04-06-2020" : 50,
                      "04-07-2020" : 51,
                      "04-08-2020" : 52,
                      "04-09-2020" : 51,
                      "04-10-2020" : 53,
                      "04-11-2020" : 52,
                      "04-12-2020" : 52,
                      "04-13-2020" : 53
                    },
                    "county2" : {
                      "03-30-2020" : 68,
                      "03-31-2020" : 69,
                      "04-01-2020" : 69,
                      "04-02-2020" : 70,
                      "04-03-2020" : 72,
                      "04-04-2020" : 74,
                      "04-05-2020" : 76,
                      "04-06-2020" : 78,
                      "04-07-2020" : 80,
                      "04-08-2020" : 83,
                      "04-09-2020" : 86,
                      "04-10-2020" : 89,
                      "04-11-2020" : 92,
                      "04-12-2020" : 96,
                      "04-13-2020" : 101
                    }
                  }
    // todo: determine chart type based on data
    var chartType = barChart;
    // if(geo) {}
    // console.log(currentSensor);
    // console.log(currentLevel);

    return chartType, graphData;
  }

  class Chart {

    constructor(chartType, data) {
      console.log("chart constructor: " + chartType);
      var chart;
      this.x = null;
      this.y = null;
      switch (chartType) {
          case 'Bar_Chart':
              console.log("bar chart");
              chart = new BarChart();
              chart.setData(data);
              break;
          case lineGraph:
              chart = new LineGraph();
              chart.setData(data);
              break;
          default:
              TypeError('Chart type not a valid type.');
      }
      return chart;
    }

    setData(data) {
      console.log("data set: " + data);
      this.verifyDataFormat(data);
      this.data === null ? this.data = data : new Error('Cannot set data. Data already set. Use update method to change values.');
    }

    getData() { return this.data };

    isChart(chart) {
      var result = null;
      try {
        chart.chartType in charts ? result = true : result = false;
      } catch (e) {
        if(e.name == 'ReferenceError') {
          result = false;
        }
      }
      return result;
    }

    verifyDataFormat(){};

    draw(){
      // if there is an existing chart, remove it and redraw
      d3.select(el).selectAll('*').remove();

      // size chart
      var margin = {top: 20, right: 20, bottom: 70, left: 40},
        width = w - margin.left - margin.right,
        height = .75*w - margin.top - margin.bottom;

      // parse the date time
      var parseDate = d3.timeParse('%m-%d-%Y');

      // set ranges
      this.x = d3.scaleBand()
                  .rangeRound([0, width]);
      this.y = d3.scaleLinear()
                  .range([height, 0]);

      // attach graphic
      var svg = d3.select(el).append('svg')
                    .attr('width', width + margin.left + margin.right)
                    .attr('height', height + margin.top + margin.bottom)
                    .append('g')
                    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      // draw axes
      svg.append('g')
          .attr('transform', 'translate(0,' + height + ')')
          .call(d3.axisBottom(this.x));
      svg.append('g')
          .call(d3.axisLeft(this.y));
    }

    updateChart(){};
  }

  class BarChart extends Chart {

      // verify that the supplied data is an array of integers for a single data source
      verifyDataFormat(data) {
          console.log("bar chart");
          super.verifyDataFormat();
          !Number.isInteger(Object.values(data)) ? TypeError('Provided data is of the wrong type. Only integers accepted.') : true;
          data.length > 1 ? RangeError('Bar charts are only valid for single data sources. Comparisons are not supported.') : true;
          data.length < 1 ? ReferenceError('No data was provided.') : true;
      }

      draw() {
        super.draw();

        // construct the x and y domain from the data
        this.x.domain(this.getData().map(function(d) { return d.date; }));
        this.y.domain([0, d3.max(this.getData(), function(d) { return  d.value; })]);

        // fill in the bar chart according to the data
        svg.selectAll('bar')
          .data(this.data)
          .enter().append('rect')
          .attr('class', 'bar')
          .attr('x', function(d) { return this.x(d.date); })
          .attr('width', this.x.bandwidth())
          .attr('y', function (d) { return this.y(d.value); })
          .attr('height', function (d) { return height - this.y(d.value); });

        // draw axes
        // svg.append('g')
        //     .attr('transform', 'translate(0,' + height + ')')
        //     .call(d3.axisBottom(x));
        // svg.append('g')
        //     .call(d3.axisLeft(y));
      }
  }

  class LineGraph extends Chart {

  }
</script>

<p>cool line graph with options</p>
<p>
  currently viewing sensor
  <b>{$currentSensor}</b>
  at level
  <b>{$currentLevel}</b>
  for
  <b>{$selectedRegion}</b>
</p>

<!-- bind:this sets the variable el to the HTML div you can then select using d3 as above-->
<div bind:clientWidth={w}>
  <div bind:this={el}></div>
</div>
