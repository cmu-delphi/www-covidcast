<script>
  import questionCircleIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/question-circle.svg';
  import arrowDownIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/chevron-down.svg';
  import { questionCategories } from './questions';
</script>

<style>
  .mobile-survey-toc {
    display: flex;
    flex-direction: column;
  }
  .survey-nav-container {
    padding: 0;
    left: 0;
    right: 0;
  }
  .survey-nav {
    padding: 0;
    width: 100%;
  }
  .survey-nav li {
    border-top: 1px solid #d2d2d2;
    font-weight: 400;
    padding: 20px 0 20px 40px;
  }

  .toc-button {
    display: block;
    background: white;
    border: none;
    font-size: 0.875rem;
    border-top: 1px solid #d3d4d8;
    padding: 20px 10px 20px 27px;
    color: #232735;
    font-weight: 600;
    text-align: left;
    display: flex;
    align-items: center;
  }
  .toc-button:focus,
  .toc-button:active {
    outline: none;
  }
  .grow {
    flex-grow: 1;
  }
</style>

<div class="mobile-survey-toc uk-hidden@s">
  <button class="toc-button">
    <span class="inline-svg-icon">
      {@html questionCircleIcon}
    </span>
    <span class="grow">Survey Questions</span>
    <span class="inline-svg-icon">
      {@html arrowDownIcon}
    </span>
  </button>
  <div
    class="survey-nav-container uk-dropdown uk-dropdown-stack"
    uk-dropdown="mode: click; offset: 0; position: bottom-right;">
    <ul class="survey-nav uk-nav uk-navbar-dropdown-nav">
      {#each questionCategories as cat, i}
        <li class="nav-dropdown-parent">
          <a href="#{cat.anchor}" data-uk-scroll="offset: 130">{i + 1}. {cat.name}</a>
        </li>
      {/each}
    </ul>
  </div>
</div>
