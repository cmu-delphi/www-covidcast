const { coordEach } = require('@turf/meta');
const geo = require(`./hrr.geo.json`);
const fs = require('fs');
const path = require('path');

// for some unknown reason the python covidcast packages
// shifts the coordinates by a magic factor to match the other shape files
// see also https://github.com/cmu-delphi/covidcast/commit/b1f2a78dda9c73f297faf9db4bd7e6467ea890d3#diff-4a409b3a28293edf2ca20f12987a7d77692ef30c2f2257bdf698810a2d833154
const MAGIC_SHIFT = [0, -0.185];
coordEach(geo, (currentCoord) => {
  currentCoord[0] += MAGIC_SHIFT[0];
  currentCoord[1] += MAGIC_SHIFT[1];
});

fs.writeFileSync(path.resolve(__dirname, `./hrr.shifted.geo.json`), JSON.stringify(geo));
