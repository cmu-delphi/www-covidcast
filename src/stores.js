import { writable, readable, derived } from "svelte/store";
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
  "Metropolitan Statistical Area",
  "Hospital Reporting Region",
  "State",
]);
export const geojsons = readable(
  new Map([
    // ["ZIP-5 Area", "./zip.json"],
    ["County", "./gz_2010_us_050_00_5m.json"],
    ["State", "./gz_2010_us_040_00_5m.json"],
    ["Metropolitan Statistical Area", "./msa.json"],
    ["Hospital Reporting Region", "./hrr.json"],
  ])
);
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
