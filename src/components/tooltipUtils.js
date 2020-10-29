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
    placement: 'top',
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
  if (item && item.datum != null) {
    return resolveDatum(item.datum);
  }
  return item;
}
/**
 * create a vega tooltip adapter for the given svelte component class
 */
export function createVegaTooltipAdapter(svelteComponent, initialExtraProps = {}) {
  if (!svelteComponent) {
    return undefined;
  }
  let destroyed = false;
  let tooltip = null;
  let extraProps = initialExtraProps;

  const tooltipHandler = (_, event, item, value) => {
    if (destroyed) {
      return;
    }
    const { popper, update, hide } = getOrInitPopper();
    // hide tooltip for null, undefined, or empty string values,
    // or when the item's datum.value is null.
    const datum = resolveDatum(item);
    if (value == null || value === '' || datum.value == null) {
      hide();
      if (tooltip) {
        tooltip.$set({
          hidden: true,
        });
      }
      return;
    }
    update(event.clientX, event.clientY);
    if (tooltip) {
      tooltip.$set({
        hidden: false,
        item: resolveDatum(item),
      });
    } else {
      tooltip = new svelteComponent({
        target: popper,
        props: {
          ...extraProps,
          hidden: false,
          item: resolveDatum(item),
        },
      });
    }
  };

  tooltipHandler.destroy = () => {
    if (tooltip) {
      tooltip.$destroy();
      tooltip = null;
    }
    destroyed = true;
  };
  tooltipHandler.update = (newExtraProps) => {
    extraProps = newExtraProps;
    if (tooltip) {
      tooltip.$set({
        ...extraProps,
      });
    }
  };
  return tooltipHandler;
}
