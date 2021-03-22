<script>
  import { currentMode, currentSensor } from '../../stores';
  import { modeByID } from '../';
  import { scrollToTop } from '../../util';

  export let sensors = [];
  export let what = 'getting worse';

  function switchSensor(e) {
    currentMode.set(modeByID.indicator);
    currentSensor.set(e.currentTarget.dataset.key);
    scrollToTop();
  }
</script>

{#if !sensors}
  N/A are {what}.
{:else if sensors.length === 0}
  None are {what}.
{:else if sensors.length === 1}
  <a
    class="uk-link-text"
    href="../indicator?sensor={sensors[0].key}"
    on:click|preventDefault={switchSensor}
    data-key={sensors[0].key}>"{sensors[0].name}"</a
  >
  is {what}.
{:else}
  {#each sensors.slice(0, sensors.length - 1) as w}
    <a class="uk-link-text" href="../indicator?sensor={w.key}" on:click|preventDefault={switchSensor} data-key={w.key}
      >"{w.name}"</a
    >,
  {/each}
  and
  <a
    class="uk-link-text"
    href="../indicator?sensor={sensors[0].key}"
    on:click|preventDefault={switchSensor}
    data-key={sensors[sensors.length - 1].key}>"{sensors[sensors.length - 1].name}"</a
  >
  are {what}.
{/if}
