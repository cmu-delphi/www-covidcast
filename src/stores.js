import { writable, readable } from "svelte/store";

export const sensors = readable([
  "Optum Hospitalizations",
  "Facebook Surveys",
  "Google Surveys",
  "Google Health Trends",
  "Quidel Flu Tests",
  "Crowdcast",
  "Kinsa Temperatures",
]);
export const currentSensor = writable("optum");

export const levels = readable([
  "ZIP-5 Area",
  "County",
  "Metropolitan Statistical Area",
  "State",
]);
export const geojsons = readable(
  new Map([
    ["ZIP-5 Area", ""],
    ["County", "./gz_2010_us_050_00_5m.json"],
    ["Metropolitan Statistical Area", ""],
    ["State", "./gz_2010_us_040_00_5m.json"],
  ])
);
export const currentLevel = writable("State");

// EpiWeek in form YYYYWW
export const currentWeek = writable(202014);

export const data = writable({});

export const selectedRegion = writable("");
