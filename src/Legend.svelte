<script>
  import { signalType } from './stores.js';
</script>

<style>
  .legend {
    font-size: 0.8rem;
    border-radius: 8px;
    padding: 10px 15px;
    box-sizing: border-box;
    background-color: rgba(255, 255, 255, 0.7);
    transition: all 0.1s ease-in;
  }

  .legend:hover {
    background-color: rgba(255, 255, 255, 0.9);
  }

  .legend.value {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .color {
    width: 20px;
    height: 80px;
    /* border-radius: 50%; */
    margin-right: 10px;
    display: inline-block;
    border: 1px solid #dbdbdb;
  }

  .legend p {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    color: rgba(0, 0, 0, 0.7);
    margin: 5px 0px;
  }

  .legend-bar {
    background: linear-gradient(to top, #fff, #c41230);
    width: 20px;
    height: 300px;
  }

  .dec {
    background-color: #224477;
  }
  .const {
    background-color: #fff;
  }
  .inc {
    background-color: #c41230;
  }
</style>

<div class="legend {$signalType === 'value' ? 'value' : null}">
  {#if $signalType === 'direction'}
    <p>
      <span class="color inc" />
      Increasing
    </p>
    <p>
      <span class="color const" />
      Constant
    </p>
    <p>
      <span class="color dec" />
      Decreasing
    </p>
  {:else}
    <p>High</p>
    <p class="legend-bar" />
    <p>None</p>
  {/if}
</div>
