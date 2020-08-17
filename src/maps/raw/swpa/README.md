



## Neighborhoods

Data from https://data.wprdc.org/dataset/neighborhoods1

then they were reprojected using:

https://github.com/developmentseed/dirty-reprojectors
```sh
cat neighborhoods.geo.json | npx dirty-reproject --forward albersUsa > neighborhoods_reprojected.geo.json
```

zip code tabulation areas (ZCTAs):
https://www.census.gov/geographies/mapping-files/time-series/geo/cartographic-boundary.html