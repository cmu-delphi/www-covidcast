const {coordEach} = require('@turf/meta');
const geo = require(`./hrr.geo.json`);
const fs = require('fs');
const path = require('path');

coordEach(geo, (currentCoord) => {
  // https://github.com/cmu-delphi/covidcast/commit/b1f2a78dda9c73f297faf9db4bd7e6467ea890d3#diff-4a409b3a28293edf2ca20f12987a7d77692ef30c2f2257bdf698810a2d833154
  currentCoord[1] += -0.185;
});

fs.writeFileSync(path.resolve(__dirname, `./hrr.shifted.geo.json`), JSON.stringify(geo));