<script>
  import { signalType, encoding, currentSensorEntry } from '../stores';
  import EncodingOptions from './EncodingOptions.svelte';
  import DirectionLegend from './legends/DirectionLegend.svelte';
  import ColorLegend from './legends/ColorLegend.svelte';
  import BubbleLegend from './legends/BubbleLegend.svelte';
  import SpikeLegend from './legends/SpikeLegend.svelte';

  export let loading = false;
</script>

<style>
  .legend {
    font-size: 0.8rem;
    box-sizing: border-box;
    height: 100%;
    /* if the option for the bubble encoding is visible for specific indicators (e.g., cases), the width of the legend can expand. So do not fix it to a certain number.*/
    /* width: 376px; */
    flex-direction: column;
  }

  .legend.value {
    display: flex;
    flex-direction: column;
    justify-content: left;
  }
</style>

<div aria-label="legend" class="legend {$signalType === 'value' ? 'value' : ''}">
  <EncodingOptions sensor={$currentSensorEntry} />
  {#if $signalType === 'direction'}
    <DirectionLegend />
  {:else if $encoding === 'color'}
    <ColorLegend {loading} />
  {:else if $encoding === 'bubble'}
    <BubbleLegend {loading} />
  {:else if $encoding === 'spike'}
    <SpikeLegend {loading} />
  {/if}
</div>
