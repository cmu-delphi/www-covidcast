<script>
  import questionCircleIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/question-circle.svg';
  import arrowDownIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/chevron-down.svg';
  import { questionCategories } from './questions';
</script>

<style>
  .mobile-survey-toc {
    display: none;
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

  .mobile-survey-container {
    border-top: 1px solid #d3d4d8;
    background: white;    
  }

  .toc-button-container {
    flex-grow: 1;
    grid-column: 3/11;
    display: flex;
    position: relative;
  }

  .toc-button {
    flex-grow: 1;
    display: block;
    background: white;
    border: none;
    font-size: 0.875rem;
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

  @media only screen and (max-width: 1000px) {
    .mobile-survey-toc {
      display: flex;
    }
    .mobile-survey-container {
      display: grid;
    }
      /* padding-left: 30px;
      padding-right: 30px;
    } */
  }
  @media only screen and (max-width: 715px) {
    .mobile-survey-container {
      display: flex;
    }
  }
</style>

<div class="mobile-survey-toc">
  <div class="mobile-survey-container content-grid">
    <div class="toc-button-container">
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
        uk-dropdown="mode: click; offset: 0; position: bottom-left;">
        <ul class="survey-nav uk-nav uk-navbar-dropdown-nav">
          {#each questionCategories as cat, i}
            <li class="nav-dropdown-parent">
              <a href="#{cat.anchor}" data-uk-scroll="offset: 130">{i + 1}. {cat.name}</a>
            </li>
          {/each}
        </ul>
      </div>
    </div>
  </div>
</div>
