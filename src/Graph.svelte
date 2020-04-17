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

  function drawGraph() {
    // var test = getData();
    console.log('draw graph');

    // size chart
    var margin = { top: 20, right: 20, bottom: 70, left: 40 },
      width = w - margin.left - margin.right,
      height = 0.66 * w - margin.top - margin.bottom;

    // parse the date time
    var parseDate = d3.timeParse('%Y-%m-%d');

    // set ranges
    var x = d3.scaleBand().rangeRound([0, width]);
    var y = d3.scaleLinear().range([height, 0]);

    // attach graphic
    var svg = d3
      .select(el)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    console.log(margin.left);
    console.log(margin.top);
    console.log(margin.left + margin.top);
    // construct the x and y domain from the data
    // x.domain(data.map(function(d) { return d.date; }));
    // y.domain([0, d3.max(data, function(d) { return  d.value; })]);

    // fill in the bar chart according to the data
    // svg.selectAll('bar')
    //   .data(data)
    //   .enter().append('rect')
    //   .attr('class', 'bar');
    // .attr('x', function(d) { return x(d.date); })
    // .attr('width', x.bandwidth())
    // .attr('y', function (d) { return y(d.value); })
    // .attr('height', function (d) { return height - y(d.value); });

    // append the axes to the chart
    svg
      .append('g')
      .attr('transform', 'translate(0,' + height + ')')
      .call(d3.axisBottom(x));
    svg.append('g').call(d3.axisLeft(y));

    // d3.select(el)
    //     .html('unicorn');
    //   var svg = d3
    //     .select(el)
    //     .append("svg")
    //     .attr("width", width + margin.left + margin.right)
    //     .attr("height", height + margin.top + margin.bottom)
    //     .append("g")
    //     .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    //
    //   var x = d3
    //     .scaleTime()
    //     .domain(d3.extent(data, d => d.date))
    //     .range([0, width]);
    //   var y = d3
    //     .scaleLinear()
    //     .domain([0, d3.max(data, d => +d.value)])
    //     .range([height, 0]);
    //
    //   svg
    //     .append("g")
    //     .attr("transform", "translate(0," + height + ")")
    //     .call(d3.axisBottom(x));
    //   svg.append("g").call(d3.axisLeft(y));
    //
    //   let line = d3
    //     .line()
    //     .x(d => x(d.date))
    //     .y(d => y(+d.value));
    //
    //   svg
    //     .append("path")
    //     .attr("class", "line")
    //     .attr("d", line(data));
  }

  // todo
  function updateGraph() {
    console.log('update');
  }

  // parse data
  function getData() {
    console.log('test function call');
    let data = $currentData;
    let region = $selectedRegion;
    console.log(data['0']);
    console.log(region);

    // search for the ID
    let id = $selectedRegion.GEO_ID;
    let re = new RegExp('US[0-9]+');
    let geo = re.exec(id);
    let graphData = data[geo];
    console.log(graphData);
    // todo: finish parsing data
    // if(geo) {}
    // console.log(currentSensor);
    // console.log(currentLevel);

    return graphData;
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
  <div id="graph" bind:this={el}>test</div>
</div>
