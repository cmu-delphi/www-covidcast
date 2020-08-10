<script>
  import { signalType, encoding } from '../stores';
  import EncodingOptions from './EncodingOptions.svelte';
  import DirectionLegend from './legends/DirectionLegend.svelte';
  import ColorLegend from './legends/ColorLegend.svelte';
  import BubbleLegend from './legends/BubbleLegend.svelte';
  import SpikeLegend from './legends/SpikeLegend.svelte';
</script>

<style>
  .legend {
    font-size: 0.8rem;
    /* border-radius: 8px; */
    padding: 15px 15px;
    box-sizing: border-box;

    transition: all 0.1s ease-in;

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
  <EncodingOptions />
  {#if $signalType === 'direction'}
    <DirectionLegend />
  {:else if $encoding === 'color'}
    <ColorLegend />
  {:else if $encoding === 'bubble'}
    <BubbleLegend />
  {:else if $encoding === 'spike'}
    <SpikeLegend />
  {/if}
</div>
