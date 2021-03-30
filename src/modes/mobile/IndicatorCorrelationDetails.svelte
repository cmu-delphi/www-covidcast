<script>
  /**
   * @type {import("../../stores/params").Sensor}
   */
  export let primary;
  /**
   * @type {import("../../stores/params").Sensor}
   */
  export let secondary;
  /**
   * @type {import("../../stores/params").EpiDataRow[]}
   */
  export let primaryData;
  /**
   * @type {import("../../stores/params").EpiDataRow[]}
   */
  export let secondaryData;
</script>

<div>
  {primary.name} ({primaryData.length}) - {secondary.name} ({secondaryData.length})
</div>
