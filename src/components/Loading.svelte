<script>
  import { currentDataReadyOnMap } from '../stores';
</script>

<style>
  .loader {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .loader::before {
    content: '';
    border: 4px solid #f3f3f3;
    border-radius: 50%;
    border-top: 4px solid #c41230;
    width: 20px;
    height: 20px;
    -webkit-animation: spin 1s linear infinite; /* Safari */
    animation: spin 1s linear infinite;
  }

  /* Safari */
  @-webkit-keyframes spin {
    0% {
      -webkit-transform: rotate(0deg);
    }
    100% {
      -webkit-transform: rotate(360deg);
    }
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>

{#if !$currentDataReadyOnMap}
  <div class="loader" />
{/if}
