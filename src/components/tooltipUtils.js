import { createPopper } from '@popperjs/core';

// based on https://popper.js.org/docs/v2/virtual-elements/

let tooltip = null;

function getOrInitPopper() {
  if (tooltip) {
    return tooltip;
  }
  const popper = document.createElement('div');
  popper.classList.add('viz-tooltip', 'mapboxgl-popup-content', 'mapboxgl-map');
  document.body.appendChild(popper);

  let bb = {
    width: 0,
    height: 0,
    x: 0,
    y: 0,
  };
  const virtualElement = {
    getBoundingClientRect: () => ({
      left: bb.x,
      right: bb.x + bb.width,
      width: bb.width,
      top: bb.y,
      bottom: bb.y + bb.height,
      height: bb.height,
    }),
  };

  const instance = createPopper(virtualElement, popper, {
    placement: 'top-start',
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [0, 8],
        },
      },
    ],
  });

  const update = (x = 0, y = 0, width = 0, height = 0) => {
    bb.x = x;
    bb.y = y;
    bb.width = width;
    bb.height = height;
    popper.style.display = '';
    instance.update();
  };
  const hide = () => {
    popper.style.display = 'none';
  };
  tooltip = { instance, popper, update, hide };
  return { instance, popper, update, hide };
}

function resolveDatum(item) {
  // console.info('resolveDatum', item);
  if (item && item.datum != null) {
    // console.info('resolveDatum recurse');
    return resolveDatum(item.datum);
  }
  return item;
}
/**
 * create a vega tooltip adapter for the given svelte component class
 */
export function createVegaTooltipAdapter(svelteComponent, initialExtraProps = {}) {
  let destroyed = false;
  let tooltip = null;
  console.info('createVegaTooltipAdapter', initialExtraProps);
  let extraProps = initialExtraProps;
  let pp = {};

  const tooltipHandler = (_, event, item, value) => {
    if (destroyed) {
      return;
    }
    pp = { ...getOrInitPopper() };
    // hide tooltip for null, undefined, or empty string values,
    // or when the item's datum.value is null.
    let datum = resolveDatum(item);
    console.info('tooltipHandler datum', datum);
    if (value == null || value === '' || datum.value == null) {
      console.info('tooltipHandler hide');
      if (!pp.hide) return;
      pp.hide();
      if (tooltip) {
        console.info('tooltipHandler set hidden');
        tooltip.$set({
          hidden: true,
        });
      }
      return;
    }
    pp.update(event.clientX, event.clientY);
    datum = resolveDatum(item);
    if (tooltip) {
      console.info('tooltip exists');
      tooltip.$set({
        hidden: false,
        item: datum,
      });
    } else {
      tooltip = new svelteComponent({
        target: pp.popper,
        props: {
          ...extraProps,
          hidden: false,
          item: datum,
        },
      });
      // console.info('popper sveltComponent created', tooltip);
    }
  };

  tooltipHandler.clear = () => {
    console.info('tooltipHandler hide');
    return;
    // if (!pp.hide) return;
    // pp.hide();
    // if (tooltip) {
    //   console.info('tooltipHandler set hidden');
    //   tooltip.$set({
    //     hidden: true,
    //   });
    // }
  };
  tooltipHandler.destroy = () => {
    if (tooltip) {
      console.info('destroy tooltip');
      tooltip.$destroy();
      tooltip = null;
    }
    destroyed = true;
  };
  tooltipHandler.update = (newExtraProps) => {
    extraProps = newExtraProps;
    if (tooltip) {
      console.info('update tooltip', extraProps);
      tooltip.$set({
        ...extraProps,
      });
    }
  };
  return tooltipHandler;
}
