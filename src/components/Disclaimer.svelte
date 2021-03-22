<script>
  import Cookies from 'js-cookie';
  let show = Cookies.get('covidcast-disclaimer') !== 'y';

  function hide() {
    show = false;
    Cookies.set('covidcast-disclaimer', 'y', { expires: 7 }); // 7 days
  }
</script>

{#if show}
  <div class="disclaimer" data-uk-alert>
    <a class="uk-alert-close" data-uk-close href="./" on:click|preventDefault={hide}
      ><span aria-hidden="false">Close</span></a
    >
    The content of the COVIDcast site and Epidata API are provided on an AS-IS, AS-AVAILABLE basis and are not intended for
    diagnostic or treatment purposes, or for guidance on any type of travel. Please refer to the
    <a href="https://delphi.cmu.edu/covidcast/terms-of-use">Terms of Use</a>.
  </div>
{/if}

<style>
  .disclaimer {
    margin: 0;
    background: #333333;
    color: #eeeeee;
    font-style: italic;
    font-size: 12px;
    text-align: center;
  }
</style>
