<script>
  import { countyInfo, nationInfo, stateInfo } from '../../maps';
  import SurveyParameters from '../survey/SurveyParameters.svelte';

  export let sensor;
</script>

<SurveyParameters {sensor} items={[nationInfo, ...stateInfo, ...countyInfo]} placeholder="Search by State or County" />
