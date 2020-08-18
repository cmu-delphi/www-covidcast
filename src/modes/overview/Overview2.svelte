<script>
  import { levelList } from '../../stores';
  import USMapBoxWrapper from '../../components/MapBox/USMapBoxWrapper';
  import OverviewWrapper from './OverviewWrapper.svelte';
  import { nameInfos } from '../../maps';
</script>

<OverviewWrapper wrapperClass={USMapBoxWrapper} regionSearchList={nameInfos} {levelList} />
