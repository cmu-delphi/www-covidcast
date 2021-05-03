import type { Config, TopLevelSpec } from 'vega-lite';

export const commonConfig: Config = {
  customFormatTypes: true,
  font: '"Open Sans", Roboto, Arial, sans-serif',
  title: {
    fontSize: 16,
    fontWeight: 'normal',
    align: 'left',
    anchor: 'start',
  },
  axis: {
    labelFontSize: 14,
    titleFontWeight: 'normal',
  },
  view: {
    stroke: null,
  },
};

export const CREDIT = 'Delphi Group, delphi.cmu.edu/covidcast';

export const BASE_SPEC: Partial<TopLevelSpec> = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  autosize: {
    type: 'none',
    contains: 'padding',
    resize: true,
  },
  width: 100,
  height: 100,
  data: { name: 'values' },
  config: commonConfig,
};

/**
 * join the title if there is enough space
 */
export function joinTitle(title: string | string[], isMobile?: boolean): string | string[] {
  if (Array.isArray(title) && (!isMobile || title.reduce((acc, v) => acc + v.length, 0) < 40)) {
    return title.join(' '); // single title line
  }
  return title;
}

/**
 * guesses the top padding based on the title settings
 */
export function guessTopPadding(title: string | string[], subTitle?: string, basePadding = 8): number {
  let topOffset = basePadding;
  if (title) {
    topOffset += 22 * (Array.isArray(title) ? title.length : 1);
  }
  if (subTitle) {
    topOffset += 10;
  }
  return topOffset;
}
