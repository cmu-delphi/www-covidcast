<script>
  import { encoding } from '../stores';

  function toggleSwitch() {
    if ($encoding === 'color') {
      encoding.set('bubble');
    } else {
      encoding.set('color');
    }
  }
</script>

<style>
  .toggle {
    color: #444;
  }

  .option-title {
    margin: 0 5px;
    color: #444;
  }

  .button {
    margin-top: 0.2em;
    background-size: 60%;
    background-image: url('../assets/imgs/bubble.png');
    background-position: center;
    background-repeat: no-repeat;

    width: 6em;
    height: 4em;
  }

  .button.bubble {
    background-image: url('../assets/imgs/choropleth.png');
  }
</style>

<div class="toggle">
  <label class="option-title">Switch to</label>
  <button
    aria-pressed={$encoding === 'bubble' ? 'true' : 'false'}
    class="pg-button button"
    class:bubble={$encoding === 'bubble'}
    on:click={() => {
      toggleSwitch();
    }}>
    <span aria-hidden>{$encoding === 'bubble' ? 'Switch to Choropleth map' : 'Switch to Bubble map'}</span>
  </button>
</div>
