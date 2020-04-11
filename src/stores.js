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
  "State",
  "Hospital Referral Region",
  "Metropolitan Statistical Area",
  "County",
  "ZIP-5 Area"
]);
export const geojsons = readable(
  new Map([
    ["State", "./gz_2010_us_040_00_5m.json"],
    ["Hospital Referral Region", "./hospital_referral_region.geojson"],
    ["Metropolitan Statistical Area", "./tl_2019_us_metdiv.geojson"],
    ["County", "./gz_2010_us_050_00_5m.json"],
    ["ZIP-5 Area", ""],
    

  ])
);
export const currentLevel = writable("State");

// EpiWeek in form YYYYWW
export const currentWeek = writable(202014);

export const data = writable({});

export const selectedRegion = writable("");
