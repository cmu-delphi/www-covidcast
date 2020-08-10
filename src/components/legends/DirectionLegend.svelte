<script>
  import { DIRECTION_THEME } from '../../theme';
</script>

<style>
  ul {
    margin: 0;
    padding: 0;
    display: flex;
    justify-content: space-around;
  }

  li {
    display: block;
    float: left;
    width: 110px;
    margin-left: 0px;
    padding-top: 0px;
    text-align: center;
    font-size: 80%;
    list-style: none;
  }

  div.color-block {
    display: block;
    float: left;
    height: 15px;
    width: 110px;
  }
</style>

<ul>
  <li>
    <div class="color-block" style="background-color: {DIRECTION_THEME.increasing}" />
    {@html DIRECTION_THEME.increasingIcon}
    Increasing
  </li>
  <li>
    <div class="color-block" style="background-color: {DIRECTION_THEME.steady}" />
    {@html DIRECTION_THEME.steadyIcon}
    Steady
  </li>
  <li>
    <div class="color-block" style="background-color: {DIRECTION_THEME.decreasing}" />
    {@html DIRECTION_THEME.decreasingIcon}
    Decreasing
  </li>
</ul>
