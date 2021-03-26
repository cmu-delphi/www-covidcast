import { createPopper } from '@popperjs/core';

// based on https://popper.js.org/docs/v2/virtual-elements/

let tooltip = null;

function getOrInitPopper() {
  if (tooltip) {
    return tooltip;
  }
  const popper = document.createElement('div');
  popper.classList.add('viz-tooltip');
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

  const update = (id, x = 0, y = 0) => {
    bb.x = x;
    bb.y = y;
    bb.width = 0;
    bb.height = 0;
    popper.style.display = '';
    const currentlyActive = popper.dataset.active;
    if (currentlyActive !== id) {
      // hide the old content
      const old = currentlyActive ? popper.querySelector(`[data-id="${currentlyActive}"]`) : null;
      if (old) {
        old.setAttribute('hidden', '');
      }
      popper.dataset.active = id;
    }
    instance.update();
  };
  const hide = () => {
    const currentlyActive = popper.dataset.active;
    if (currentlyActive) {
      // hide the old content
      const old = popper.querySelector(`[data-id="${currentlyActive}"]`);
      if (old) {
        old.setAttribute('hidden', '');
      }
      popper.dataset.active = ''; // hide active one
    }
    if (popper.style.display !== 'none') {
      popper.style.display = 'none';
      return true;
    }
    return false;
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
 * checks whether the reason for the hide is that the user is moving into the tooltip
 * @param {MouseEvent} event
 */
function isClickingTooltip(event) {
  if (!event || !event.relatedTarget) {
    return false;
  }
  return (
    typeof event.relatedTarget.matches === 'function' &&
    (event.relatedTarget.matches('.viz-tooltip') || event.relatedTarget.closest('.viz-tooltip') != null)
  );
}
/**
 * create a vega tooltip adapter for the given svelte component class
 */
export function createVegaTooltipAdapter(svelteComponent, initialExtraProps = {}) {
  if (!svelteComponent) {
    return undefined;
  }
  let destroyed = false;
  /**
   * @type {import('svelte').SvelteComponent | null}
   */
  let tooltip = null;
  /**
   * @type {HTMLElement | null}
   */
  let tooltipElem = null;
  let extraProps = initialExtraProps;
  // unique id for each tooltip content
  const uniqueID = Math.random().toString().substr(2, 8);

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
      if (isClickingTooltip(event)) {
        // ignore
        return;
      }
      if (hide(uniqueID) && tooltip) {
        updateProps(tooltip, {
          hidden: true,
          view,
        });
      }
      return;
    }
    update(uniqueID, event.clientX, event.clientY);
    if (tooltip) {
      tooltipElem.removeAttribute('hidden');
      updateProps(tooltip, {
        hidden: false,
        item: resolveDatum(item),
        view,
      });
    } else {
      tooltipElem = popper.ownerDocument.createElement('div');
      tooltipElem.dataset.id = uniqueID;
      popper.appendChild(tooltipElem);
      tooltip = new svelteComponent({
        target: tooltipElem,
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
    if (tooltipElem) {
      tooltipElem.remove();
      tooltipElem = null;
    }
    const { hide } = getOrInitPopper();
    hide(uniqueID);
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
