raw data:

1. Download shapefiles from https://github.com/cmu-delphi/covidcast/tree/main/Python-packages/covidcast-py/covidcast/shapefiles/hrr
1. Go to https://mapshaper.org/ and upload the files using the quick import
1. Use the website to export as GeoJSON and store it as `hrr.geo.json` in this directory
1. Shift the geo as in the Python Code:
   https://github.com/cmu-delphi/covidcast/commit/b1f2a78dda9c73f297faf9db4bd7e6467ea890d3#diff-4a409b3a28293edf2ca20f12987a7d77692ef30c2f2257bdf698810a2d833154
   ```sh
   node shift.js
   ```
1. Then reprojected using:
   https://github.com/developmentseed/dirty-reprojectors
   ```sh
   cat hrr.shifted.geo.json | npx dirty-reproject --forward albersUsa > hrr.reprojected.geo.json
   ```
