<script>
  import { formatDateYearDayOfWeekAbbr } from '../formats';
  /**
   * @type {import("../stores/params").DateParam}
   */
  export let date;
  /**
   * @type {import("../stores/params").DateParam}
   */
  export let minMaxDate;
  /**
   * @type {import('../stores/params').SensorParam}
   */
  export let casesSensor;
  /**
   * @type {import('../stores/params').SensorParam}
   */
  export let deathSensor;
  /**
   * @type {import('../stores/params').SensorParam}
   */
  export let hospitalAdmissionSensor;

  let todaysDate = new Date();
  let casesMaxDate = new Date();
  let deathSensorMaxDate = new Date();
  let hospitalAdmissionMaxDate = new Date();

  casesMaxDate = casesSensor.timeFrame.max;
  deathSensorMaxDate = deathSensor.timeFrame.max;
  hospitalAdmissionMaxDate = hospitalAdmissionSensor.timeFrame.max;
</script>

{#if casesMaxDate.toString() != date.value.toString() || deathSensorMaxDate.toString() != date.value.toString() || hospitalAdmissionMaxDate.toString() != date.value.toString()}
  <div data-uk-alert class="uk-alert-warning">
    <p>
      Data for today, {formatDateYearDayOfWeekAbbr(todaysDate)} is not yet available. The date has been set to {formatDateYearDayOfWeekAbbr(
        minMaxDate,
      )}, which is the most recent that has data for all three of the highlighted indicators. You can mouse over the
      tooltips just below this message to see the latest available date for each indicator. Note that the latest
      available date may be different for each indicator.
    </p>
  </div>
{/if}
