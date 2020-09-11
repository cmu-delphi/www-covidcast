

## Neighborhoods Pittsburgh

1. Download data from https://data.wprdc.org/dataset/neighborhoods1
1. Store file as `neighborhoods.geo.json` in this directory
1. Then reprojected using:
   https://github.com/developmentseed/dirty-reprojectors
   ```sh
   cat neighborhoods.geo.json | npx dirty-reproject --forward albersUsa > neighborhoods_reprojected.geo.json
   ```

## Municipal Allgeheny County

1. Download data from https://data.wprdc.org/dataset/allegheny-county-municipal-boundaries
1. Store file as `Allegheny_County_Municipal_Boundaries.geojson` in this directory
1. Then reprojected using:
   https://github.com/developmentseed/dirty-reprojectors
   ```sh
   cat Allegheny_County_Municipal_Boundaries.geojson | npx dirty-reproject --forward albersUsa > Allegheny_County_Municipal_Boundaries_reprojected.geo.json
   ```

TODO what are their geoIds?


## Zip Code  - Zip code tabulation areas (ZCTAs)

1. Download shapefile zip from https://www.census.gov/geographies/mapping-files/time-series/geo/cartographic-boundary.html
1. Go to https://mapshaper.org/ and upload the zip file using the quick import
1. Use the website to export as GeoJSON and store it as `cb_2019_us_zcta510_500k.json` in this directory
1. Then reprojected using:
   https://github.com/developmentseed/dirty-reprojectors
   ```sh
   cat cb_2019_us_zcta510_500k.json | npx dirty-reproject --forward albersUsa > cb_2019_us_zcta510_500k.json_reprojected.geo.json
   ```
1. Download zip to hrr info file https://atlasdata.dartmouth.edu/static/supp_research_data#crosswalks -> https://atlasdata.dartmouth.edu/downloads/geography/ZipHsaHrr18.csv.zip
1. Expand and store as `ZipHsaHrr18.csv` in this directory

TODO what are their geoIds?