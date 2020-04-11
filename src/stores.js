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
export const currentLevel = writable("zip");

// EpiWeek in form YYYYWW
export const currentWeek = writable(202014);

export const data = writable({});
export const selected = writable("");
