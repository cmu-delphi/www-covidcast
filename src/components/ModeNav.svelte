<script>
  import modes from '../modes';
  import { currentMode } from '../stores';
  import leftIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/angle-left.svg';
</script>

<div>
  <div class="uk-container breadcrumb-menu">
    <ul class="uk-breadcrumb uk-text-uppercase">
      <li>
        <a href="./">
          <span class="inline-svg-icon">
            {@html leftIcon}
          </span>
          COVIDCast
        </a>
      </li>
      <li><span>{$currentMode.label}</span></li>
    </ul>
  </div>
</div>
<div>
  <div class="uk-container uk-margin-remove-vertical">
    <ul class="uk-tab">
      {#each modes as mode}
        <li class:uk-active={$currentMode.id === mode.id} data-mode={mode.id}>
          <a
            href="?mode={mode.id}"
            on:click|preventDefault={() => {
              currentMode.set(mode);
            }}
            title={mode.tooltip}>
            <span class="inline-svg-icon">
              {@html mode.icon}
            </span>
            {mode.label}
          </a>
        </li>
      {/each}
    </ul>
  </div>
</div>
