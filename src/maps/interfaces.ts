export declare type RegionLevel = 'state' | 'county' | 'msa' | 'hrr' | 'nation' | 'mega-county';

export interface NameInfo {
  readonly name: string;
  readonly displayName: string;
  readonly id: string;
  readonly propertyId: string; // geojson: feature.property.id
  readonly population?: number;
  readonly region?: string; // just for state and county
  readonly state?: string; // just for county
  readonly level: RegionLevel;
}
