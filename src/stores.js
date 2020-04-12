import { writable, readable } from "svelte/store";
import * as d3 from "d3";

export const sensors = readable([
  "Optum Hospitalizations",
  "Facebook Surveys",
  "Google Surveys",
  "Google Health Trends",
  "Quidel Flu Tests",
  "Crowdcast",
  "Kinsa Temperatures",
]);
export const currentSensor = writable("Optum Hospitalizations");

export const levels = readable([
  // "ZIP-5 Area",
  "County",
  "State",
  // "Metropolitan Statistical Area",
  // "Hospital Reporting Region",
]);
// This loads all the GeoJSON's for each granularity and sets them in a map that the MapBox component reads as layers.
export const geojsons = readable(new Map(), function start(set) {
  Promise.all([
    d3.json("./gz_2010_us_050_00_5m.json"),
    d3.json("./gz_2010_us_040_00_5m.json"),
    // d3.json("./msa.json"),
    // d3.json("./hrr.json"),
  ]).then(([a, b, c, d]) => {
    let m = new Map();
    m.set("County", a);
    m.set("State", b);
    // m.set("Metropolitan Statistical Area", c);
    // m.set("Hospital Reporting Region", d);
    set(m);
  });
});
export const currentLevel = writable("State");

// EpiWeek in form YYYYWW
export const currentWeek = writable(202014);

export const selectedRegion = writable("");

export const sampleData = readable([], function start(set) {
  let parseTime = d3.timeParse("%Y-%m-%d");
  d3.csv("./fb-surveys.csv").then((d) =>
    set(
      d.map((s) => ({
        date: parseTime(s.Date),
        value: s.PercentCLI,
      }))
    )
  );
});
