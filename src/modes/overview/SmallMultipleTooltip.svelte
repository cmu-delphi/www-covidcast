<script>
  import { timeFormat } from 'd3-time-format';

  const formatTimeWithoutYear = timeFormat('%B %d');

  /**
   * @type {import('../../data').EpiDataRow}
   */
  export let item;
</script>

<style>
  th,
  td {
    border: none;
  }

  .right {
    text-align: right;
  }

  .area {
    text-align: center;
  }

  h5 {
    margin: 0;
    padding: 0;
  }
</style>

<div aria-label="tooltip" class="tooltip">
  <h5>{formatTimeWithoutYear(item.date_value)}</h5>
  <div>{JSON.stringify(item.value)}</div>
</div>
