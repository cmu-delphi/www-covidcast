<script>
  import { encoding } from '../stores';
</script>

<div class="toggle">
  <span class="option-title">Switch to</span>

  <div aria-label="encoding type" class="buttons-group-side pg-button-group">
    <button
      aria-pressed={$encoding === 'color' ? 'true' : 'false'}
      class="pg-button button choropleth"
      class:selected={$encoding === 'color'}
      on:click={() => {
        encoding.set('color');
      }}
      title="Switch to Choropleth"
    >
      <span aria-hidden="false">Switch to Choropleth</span>
    </button>
    <button
      aria-pressed={$encoding === 'bubble' ? 'true' : 'false'}
      class="pg-button button bubble"
      class:selected={$encoding === 'bubble'}
      on:click={() => {
        encoding.set('bubble');
      }}
      title="Switch to Bubble Map"
    >
      <span aria-hidden="false">Switch to Bubble Map</span>
    </button>
    <button
      aria-pressed={$encoding === 'spike' ? 'true' : 'false'}
      class="pg-button button spike"
      class:selected={$encoding === 'spike'}
      on:click={() => {
        encoding.set('spike');
      }}
      title="Switch to Spike Map"
    >
      <span aria-hidden="false">Switch to Spike Map</span>
    </button>
  </div>
</div>

<style>
  .toggle {
    position: relative;
    align-items: center;
  }

  .option-title {
    margin: 0 5px;
    color: #444;
  }

  .buttons-group-side {
    margin-top: 0.2em;
  }

  .button {
    position: relative;

    background-size: 60%;
    background-position: center;
    background-repeat: no-repeat;

    width: 5.5em;
    height: 3em;
  }

  .choropleth {
    background-image: url('../assets/imgs/choropleth_small.png');
  }
  .bubble {
    background-image: url('../assets/imgs/bubble_small.png');
  }
  .spike {
    background-image: url('../assets/imgs/spike_small.png');
  }

  .button:focus,
  .button:active {
    outline: none;
  }
</style>
