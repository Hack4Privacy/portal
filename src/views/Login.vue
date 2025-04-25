<script setup>
import { LxButton } from '@wntr/lx-ui';
import { useI18n } from 'vue-i18n';

const i18n = useI18n();
</script>

<template>
  <LxButton
    :href="{ name: 'dashboard' }"
    :label="i18n.t('pages.home.buttons.loginAuthorized')"
    icon="dashboard"
  />
</template>
