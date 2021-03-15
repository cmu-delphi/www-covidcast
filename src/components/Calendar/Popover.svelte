<script>
  import { onMount, createEventDispatcher, tick } from 'svelte';

  const dispatch = createEventDispatcher();

  let popover;
  let w;
  let triggerContainer;
  let contentsWrapper;
  let translateY = 0;
  let translateX = 0;

  export let open = false;
  export let trigger;
  export let offset = 0;
  export const close = () => {
    open = false;
    dispatch('closed');
  };

  function checkForFocusLoss(evt) {
    if (!open) return;
    let el = evt.target;
    // eslint-disable-next-line
    do {
      if (el === popover) return;
      // eslint-disable-next-line
    } while ((el = el.parentNode));
    close();
  }

  onMount(() => {
    document.addEventListener('click', checkForFocusLoss);
    if (!trigger) return;
    triggerContainer.appendChild(trigger.parentNode.removeChild(trigger));

    // eslint-disable-next-line
    return () => {
      document.removeEventListener('click', checkForFocusLoss);
    };
  });

  const getDistanceToEdges = async () => {
    if (!open) {
      open = true;
    }
    await tick();
    let rect = contentsWrapper.getBoundingClientRect();
    console.log(rect.left, document.body.clientWidth, rect.right, translateX);
    return {
      top: rect.top + -1 * translateY + offset,
      bottom: window.innerHeight - rect.bottom + translateY + offset,
      left: rect.left + -1 * translateX,
      right: document.body.clientWidth - rect.right + translateX,
    };
  };

  const getTranslate = async () => {
    let dist = await getDistanceToEdges();
    let x;
    let y;
    console.log(dist);
    if (dist.top < 0) {
      y = Math.abs(dist.top);
    } else if (dist.bottom < 0) {
      y = dist.bottom;
    } else {
      y = offset;
    }
    if (dist.left < 0) {
      x = Math.abs(dist.left);
    } else if (dist.right < 0) {
      x = dist.right;
    } else {
      x = 0;
    }
    return { x, y };
  };

  const doOpen = async () => {
    const { x, y } = await getTranslate();

    translateX = x;
    translateY = y;
    open = true;

    dispatch('opened');
  };
</script>

<svelte:window bind:innerWidth={w} />
<div class="sc-popover" bind:this={popover}>
  <div class="trigger" on:click={doOpen} bind:this={triggerContainer}>
    <slot name="trigger" />
  </div>
  <div
    class="contents-wrapper"
    class:visible={open}
    style="transform: translate({translateX}px, {translateY}px)"
    bind:this={contentsWrapper}
  >
    <div class="contents">
      <div class="contents-inner">
        <slot />
      </div>
    </div>
  </div>
</div>

<style>
  .sc-popover {
    position: relative;
  }

  .contents-wrapper {
    position: absolute;
    top: 100%;
    left: -50%;
    transition: none;
    z-index: 2;
    display: none;
  }

  .contents {
    background: #fff;
    box-shadow: 0px 10px 26px rgba(0, 0, 0, 0.4);
    opacity: 0.8;
    padding-top: 0;
    display: none;
    /* rounded design refresh */
    border-radius: 7px;
    background-color: #ffffff;
    box-shadow: 0px 4px 10px rgba(151, 151, 151, 0.25);
    transition: opacity 0.25s linear;
  }

  .contents-wrapper.visible {
    display: block;
  }

  .contents-wrapper.visible .contents {
    opacity: 1;
    display: block;
  }
</style>
