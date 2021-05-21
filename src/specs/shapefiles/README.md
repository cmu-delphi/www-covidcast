
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

## export high res county
```sh
mapshaper -o format=topojson id-field=id target=county county_highres.json
mapshaper -o format=topojson id-field=id target=state state_highres.json
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
mapshaper -dissolve2 name=nation target=state no-replace
```

## create a hhs shape
```sh
mapshaper -each 'hhs_region={"10":"3","11":"3","12":"4","13":"4","15":"9","16":"10","17":"5","18":"5","19":"7","20":"7","21":"4","22":"6","23":"1","24":"3","25":"1","26":"5","27":"5","28":"4","29":"7","30":"8","31":"7","32":"9","33":"1","34":"2","35":"6","36":"2","37":"4","38":"8","39":"5","40":"6","41":"10","42":"3","44":"1","45":"4","46":"8","47":"4","48":"6","49":"8","50":"1","51":"3","53":"10","54":"3","55":"5","56":"8","66":"9","69":"9","72":"2","78":"2","09":"1","01":"4","05":"6","08":"8","04":"9","06":"9","03":"9","02":"10"}[id]'
mapshaper -dissolve2 fields=hhs_region name=hhs target=state no-replace
mapshaper -filter-fields fields=id target=state
mapshaper -rename-fields fields=id=hhs_region target=hhs
```

## export
```sh
mapshaper -o format=topojson id-field=id target=nation nation.json
mapshaper -o format=topojson id-field=id target=state state.json
mapshaper -o format=topojson id-field=id target=county county.json
mapshaper -o format=topojson id-field=id target=msa msa.json
mapshaper -o format=topojson id-field=id target=hrr hrr.json
mapshaper -o format=topojson id-field=id target=hhs hhs.json