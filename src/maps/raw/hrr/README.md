raw data:


1. Download shapefiles from https://github.com/cmu-delphi/covidcast/tree/main/Python-packages/covidcast-py/covidcast/shapefiles/hrr
1. Go to https://mapshaper.org/ and upload the files using the quick import
1. Use the website to export as GeoJSON and store it as `hrr.geo.json` in this directory
1. Then reprojected using:
   https://github.com/developmentseed/dirty-reprojectors
   ```sh
   cat hrr.geo.json | npx dirty-reproject --forward albersUsa > hrr.reprojected.geo.json
   ```