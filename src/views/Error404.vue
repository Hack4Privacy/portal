<script setup>
import useAppStore from '@/stores/useAppStore';
import useViewStore from '@/stores/useViewStore';
import { LxButton } from '@wntr/lx-ui';
import { onMounted } from 'vue';

const appStore = useAppStore();
const viewStore = useViewStore();

onMounted(() => {
  viewStore.header = false;
});
</script>
<template>
  <div class="lx-header lx-error">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      viewBox="0 0 32 32"
      xml:space="preserve"
      class="lx-illustration"
    >
      <g>
        <path
          d="M16,31.36C7.53,31.36,0.64,24.469,0.64,16S7.531,0.64,16,0.64S31.36,7.53,31.36,16S24.47,31.36,16,31.36z
		 M16,1.36C7.928,1.36,1.36,7.927,1.36,16c0,8.072,6.567,14.64,14.64,14.64c8.072,0,14.639-6.567,14.639-14.64
		C30.64,7.927,24.072,1.36,16,1.36z M20.987,23.36c-0.636,0-1.232-0.246-1.68-0.693L16,19.358l-3.308,3.309
		c-0.894,0.896-2.465,0.894-3.359,0c-0.447-0.447-0.693-1.044-0.693-1.68s0.246-1.232,0.693-1.68L12.641,16l-3.308-3.308
		c-0.926-0.926-0.926-2.433,0-3.358s2.434-0.927,3.359,0L16,12.641l3.307-3.307c0.896-0.895,2.466-0.894,3.359,0
		c0.447,0.447,0.693,1.043,0.693,1.679s-0.246,1.232-0.693,1.68L19.359,16l3.308,3.308c0.447,0.447,0.693,1.043,0.693,1.68
		s-0.246,1.232-0.693,1.68S21.624,23.36,20.987,23.36z M16,18.489c0.096,0,0.187,0.038,0.254,0.105l3.562,3.562
		c0.622,0.624,1.721,0.623,2.34,0c0.312-0.311,0.483-0.727,0.483-1.17s-0.172-0.859-0.483-1.17l-3.562-3.563
		c-0.141-0.141-0.141-0.368,0-0.509l3.562-3.562c0.312-0.311,0.483-0.727,0.483-1.17s-0.172-0.859-0.483-1.17
		c-0.619-0.621-1.718-0.624-2.34,0l-3.562,3.562c-0.141,0.141-0.368,0.141-0.509,0l-3.562-3.562c-0.623-0.623-1.72-0.622-2.341,0
		c-0.645,0.646-0.645,1.695,0,2.341l3.562,3.562c0.141,0.141,0.141,0.368,0,0.509l-3.562,3.563c-0.311,0.311-0.482,0.727-0.482,1.17
		s0.171,0.859,0.482,1.17c0.621,0.622,1.718,0.623,2.341,0l3.562-3.562C15.813,18.527,15.905,18.489,16,18.489z"
        />
      </g>
      <rect id="_Transparent_Rectangle" style="fill: none" width="32" height="32" />
    </svg>
    <h1>{{ $t('pages.error.title') }}</h1>
    <div class="lx-description">{{ appStore.error }}</div>
  </div>
  <div class="lx-button-set">
    <LxButton @click="$router.back()" :label="$t('pages.error.goBack')" icon="undo" />
    <LxButton
      :href="{
        name: 'dashboard',
      }"
      :label="$t('pages.error.goHome')"
      icon="dashboard"
      kind="secondary"
    />
  </div>
</template>
