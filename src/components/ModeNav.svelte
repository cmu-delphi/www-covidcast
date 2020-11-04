<script>
  import modes from '../modes';
  import { currentMode } from '../stores';
</script>

<ul data-uk-tab>
  {#each modes as mode}
    <li class:uk-active={$currentMode.id === mode.id}>
      <a
        href="?mode={mode.id}"
        data-mode={mode.id}
        on:click={() => {
          currentMode.set(mode);
        }}
        title={mode.tooltip}>
        {mode.label}
      </a>
    </li>
  {/each}
</ul>
