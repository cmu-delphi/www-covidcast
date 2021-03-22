<script>
  import SignalStatusTable from './SignalStatusTable.svelte';
  import '../mobile/common.css';
  import { getIndicatorStatuses } from '../../data/indicatorInfo';
  import MobileSurveyToc from '../survey/MobileSurveyToc.svelte';
  import SignalStatus from './SignalStatus.svelte';

  const signals = getIndicatorStatuses();
  const date = new Date();
</script>

<div class="root">
  <div class="mobile-header-line-bg">
    <div class="mobile-header-line">
      <h2>Signal <span>Dashboard</span></h2>
    </div>
    <MobileSurveyToc name="Signals">
      {#await signals then s}
        {#each s as signal, i}
          <li class="nav-dropdown-parent">
            <a href="#{signal.name}" data-uk-scroll>{i + 1}. {signal.name}</a>
          </li>
        {/each}
      {/await}
    </MobileSurveyToc>
  </div>
  <div class="uk-container content-grid">
    <div class="grid-3-11">
      <SignalStatusTable {date} />
    </div>
    <div class="grid-1-3">
      <div class="toc-container uk-visible@m">
        <div class="toc">
          <h5>Signals</h5>
          <ol uk-scrollspy-nav="closest: li; scroll: true;" class="uk-nav uk-nav-default">
            {#await signals then s}
              {#each s as signal (signal.name)}
                <li><a href="#{signal.name}">{signal.name}</a></li>
              {/each}
            {/await}
          </ol>
        </div>
      </div>
    </div>
    <div class="grid-3-11 questions">
      {#await signals then s}
        {#each s as signal (signal.name)}
          <SignalStatus {signal} {date} />
        {/each}
      {/await}
    </div>
  </div>
</div>

<style>
  .root {
    position: relative;
    flex: 1 1 0;
    font-size: 0.875rem;
    line-height: 1.5rem;
  }
  .questions {
    margin-top: 1em;
  }
  .toc-container {
    position: sticky;
    top: 100px;
    margin-top: 1em;
  }

  .content-grid {
    grid-row-gap: 0;
  }

  .toc {
    padding: 24px 6px 24px 24px;
  }
</style>
