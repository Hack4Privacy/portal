<script setup>
import { LxErrorPage } from '@wntr/lx-ui';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const router = useRouter();
const $t = useI18n().t;

function action(actionName) {
  if (actionName === 'dashboard') {
    router.push({ name: 'dashboard' });
    return;
  }
  router.go(-1);
}
</script>
<template>
  <LxErrorPage
    kind="403"
    @actionClick="action"
    :action-definitions="[
      { id: 'dashboard', name: $t('pages.error.goBack'), icon: 'undo' },
      {
        id: 'back',
        name: $t('pages.error.goHome'),
        icon: 'dashboard',
        kind: 'secondary',
      },
    ]"
  ></LxErrorPage>
</template>
