
# Download Shapefiles

source: https://github.com/cmu-delphi/covidcast/tree/main/Python-packages/covidcast-py/covidcast/shapefiles

# Use mapshaper

go to https://mapshaper.org/ and drag each individual directory (all files within a directory at once) in the mapshaper UI. Use the default import settings. Or use the CLI https://github.com/mbloch/mapshaper

# Use mapshaper commands

Click on the `console` button on the top right to open the mapshaper command interface.


## create common names
```sh
mapshaper -rename-layers names=hrr target=geo_export_ad86cff5-e5ed-432e-9ec2-2ce8732099ee
mapshaper -rename-layers names=state target=cb_2019_us_state_5m
mapshaper -rename-layers names=county target=cb_2019_us_county_5m
mapshaper -rename-layers names=msa target=cb_2019_us_cbsa_5m
```

## shift hrr as done in python
```sh
mapshaper -affine shift=0,-0.185 target=hrr
```

## create unified fields and delete rest
```sh
mapshaper -rename-fields fields=id=hrr_num target=hrr
mapshaper -rename-fields fields=id=GEOID target=state
mapshaper -rename-fields fields=id=GEOID target=county
mapshaper -rename-fields fields=id=GEOID target=msa

mapshaper -filter-fields fields=id target=state
mapshaper -filter-fields fields=id target=county
mapshaper -filter-fields fields=id target=msa
mapshaper -filter-fields fields=id target=hrr
```

## simplify
```sh
mapshaper -simplify percentage=10% target=state
mapshaper -simplify percentage=10% target=county
mapshaper -simplify percentage=10% target=msa
mapshaper -simplify percentage=10% target=hrr
```

## create a nation shape
```sh
mapshaper -dissolve2 name=nation target=state
```

## export
```sh
mapshaper -o format=topojson id-field=id target=nation nation.json
mapshaper -o format=topojson id-field=id target=state state.json
mapshaper -o format=topojson id-field=id target=county county.json
mapshaper -o format=topojson id-field=id target=msa msa.json
mapshaper -o format=topojson id-field=id target=hrr hrr.json