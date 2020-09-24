<script>
  import SingleModeToggle from './SingleModeToggle.svelte';
  import { modeByID } from '../modes';
</script>

<style>
  .mode-container {
    margin: 0;
    padding: 0;
    margin-left: 0.5em;
    margin-top: 1em;
  }

  li {
    cursor: pointer;
    color: black;
    margin: 0;
    display: inline-block;
    padding: 0.2em;
  }

  .active {
    font-weight: bold;
  }

  .spacer {
    width: 3em;
    cursor: default;
  }

  @media only screen and (max-width: 767px) {
    .hide-mobile {
      display: none;
    }
  }
</style>

<nav>
  <ul class="mode-container">
    <li>
      <SingleModeToggle mode={modeByID.overview} />
    </li>

    <li>
      <SingleModeToggle mode={modeByID.timelapse} />
    </li>
    <li>
      <SingleModeToggle mode={modeByID.top10} />
    </li>

    <li class="hide-mobile">
      <SingleModeToggle mode={modeByID.export} />
    </li>

    <li class="spacer" />

    <li><a href="https://delphi.cmu.edu/blog/2020/08/10/hello-world/#our-mission-and-strategy">Our mission</a></li>
    <li><a href="https://covidcast.cmu.edu/methodology.html">Data and methods</a></li>
    <li><a href="https://covidcast.cmu.edu/surveys.html">Surveys</a></li>
    <li><a href="https://covidcast.cmu.edu/covid19-response-team.html">Our team</a></li>
    <li><a href="https://covidcast.cmu.edu/terms-of-use.html">Terms of use</a></li>
  </ul>
</nav>
