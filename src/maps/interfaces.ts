export declare type RegionLevel = 'state' | 'county' | 'msa' | 'hrr' | 'nation' | 'mega-county';

export interface NameInfo {
  name: string;
  displayName: string;
  id: string;
  propertyId: string; // geojson: feature.property.id
  population?: number;
  region?: string; // just for state and county
  state?: string; // just for county
  level: RegionLevel
}
