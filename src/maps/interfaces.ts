export type RegionLevel = 'state' | 'county' | 'msa' | 'hrr' | 'nation' | 'mega-county' | 'hhs';
export type RegionArea = 'West' | 'Midwest' | 'Northeast' | 'South';

export interface RegionInfo {
  readonly name: string;
  readonly displayName: string;
  readonly id: string;
  readonly propertyId: string; // geojson: feature.property.id
  readonly population?: number;
  readonly level: RegionLevel;
}

export interface StateInfo extends RegionInfo {
  region: RegionArea;
  postal: string;
}

export interface CountyInfo extends RegionInfo {
  region: RegionArea;
  state: string;
}

export interface HRRInfo extends RegionInfo {
  state: string;
}

export interface HHSInfo extends RegionInfo {
  states: string[];
}
