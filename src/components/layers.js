/*
Layer names used in MapBox
- state
- msa
- county
- bubble-fill
- bubble-highlight-fill
- spike
- spike-outline
- spike-outline-highlight
...
*/

export const L = {
  state: {
    border: 'state-border',
  },
  msa: {
    border: 'msa-border',
  },
  county: {
    border: 'county-border',
  },
  bubble: {
    fill: 'bubble-fill',
    highlight: {
      fill: 'bubble-highlight-fill',
    },
  },
  spike: {
    fill: 'spike-fill',
    stroke: 'spike-stroke',
    highlight: {
      fill: 'spike-highlight-fill',
      stroke: 'spike-highlight-stroke',
    },
  },
};
