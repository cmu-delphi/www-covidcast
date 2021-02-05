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
          // Compute the offset from the placement.
          offset: ({ placement }) => (placement.endsWith('start') ? [8, 8] : [-8, 8]),
        },
      },
      {
        name: 'flip',
        options: {
          padding: 8,
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

function updateProps(component, props) {
  const p = { ...props };
  Object.entries(props).forEach(([prop, v]) => {
    if (component.$$.props[prop] != null && component.$$.ctx[component.$$.props[prop]] === v) {
      delete p[prop];
    }
  });
  component.$set(p);
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

  function tooltipHandler(_, event, item, value) {
    if (destroyed) {
      return;
    }
    const view = this;
    const { popper, update, hide } = getOrInitPopper();
    // hide tooltip for null, undefined, or empty string values,
    // or when the item's datum.value is null.
    const datum = resolveDatum(item);
    if (value == null || value === '' || datum.value == null) {
      hide();
      if (tooltip) {
        updateProps(tooltip, {
          hidden: true,
          view,
        });
      }
      return;
    }
    update(event.clientX, event.clientY);
    if (tooltip) {
      updateProps(tooltip, {
        hidden: false,
        item: resolveDatum(item),
        view,
      });
    } else {
      tooltip = new svelteComponent({
        target: popper,
        props: {
          ...extraProps,
          hidden: false,
          item: resolveDatum(item),
          view,
        },
      });
    }
  }

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
