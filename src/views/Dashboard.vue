<script setup>
import {
  LxFileUploader,
  LxForm,
  LxModal,
  LxRichTextDisplay,
  LxRow,
  LxValuePicker,
} from '@wntr/lx-ui';
import { ref, onMounted } from 'vue';

const categories = ref([
  {
    id: 'personCode',
    name: 'Personal ID codes',
  },
  {
    id: 'namesSurnames',
    name: 'Names, Surnames',
  },
  {
    id: 'phoneNumbers',
    name: 'Phone numbers',
  },
  {
    id: 'emailAddresses',
    name: 'Email addresses',
  },
  {
    id: 'fullAddresses',
    name: 'Full addresses',
  },
  {
    id: 'bankAccountNumbers',
    name: 'Bank account numbers',
  },
  {
    id: 'creditCardNumbers',
    name: 'Credit card numbers',
  },
  {
    id: 'passportNumbers',
    name: 'Passport or ID document numbers',
  },
  {
    id: 'socialSecurityNumbers',
    name: 'Social security numbers',
  },
  {
    id: 'medicalRecords',
    name: 'Medical records or health information',
  },
  {
    id: 'financialInformation',
    name: 'Financial information',
  },
  {
    id: 'locationData',
    name: 'Location data',
  },
  {
    id: 'biometricData',
    name: 'Biometric data references',
  },
  {
    id: 'ipAddresses',
    name: 'IP addresses',
  },
  {
    id: 'loginCredentials',
    name: 'Login credentials',
  },
]);

const selectedCategory = ref([
  'personCode',
  'socialSecurityNumbers',
  'medicalRecords',
  'creditCardNumbers',
  'bankAccountNumbers',
  'loginCredentials',
  'biometricData',
]);

const sampleMarkdown = ref('');
const documentPreviewModal = ref(null);

function tryScrolling(retries = 0, maxRetries = 20) {
  const modalElement = document.getElementsByClassName('lx-modal');

  if (!modalElement.length || !modalElement[0].getElementsByClassName('lx-main').length) {
    if (retries < maxRetries) {
      // Use setTimeout to avoid stack overflow
      setTimeout(() => tryScrolling(retries + 1, maxRetries), 100);
    }
    return;
  }

  const element = modalElement[0].getElementsByClassName('lx-main')[0];

  setInterval(() => {
    element.scrollTop += 10;
    if (Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 1) {
      console.log('Scrolling completed');
      element.scrollTop = 0;
      // clearInterval(scrollInterval);
    }
  }, 1);
}

function actionClicked(actionId) {
  if (actionId === 'sanitize') {
    documentPreviewModal.value.open();
  }
  tryScrolling();
}

onMounted(async () => {
  try {
    const response = await fetch('/sample.md');
    sampleMarkdown.value = await response.text();
  } catch (error) {
    console.error('Failed to load sample markdown:', error);
  }
});
</script>

<template>
  <div>
    <LxForm
      :column-count="2"
      :show-header="false"
      @button-click="actionClicked"
      :action-definitions="[
        {
          id: 'sanitize',
          name: 'Sanitize',
          icon: 'search',
          kind: 'primary',
        },
      ]"
    >
      <LxRow label="Data categories">
        <LxValuePicker
          label="Data categories"
          :has-search="true"
          :items="categories"
          v-model="selectedCategory"
          kind="multiple"
          :has-select-all="true"
        />
      </LxRow>
      <LxRow label="Document">
        <LxFileUploader />
      </LxRow>
    </LxForm>
    <LxModal
      size="l"
      id="documentPreviewModal"
      ref="documentPreviewModal"
      label="Reviewing document..."
    >
      <LxRichTextDisplay id="documentPreviewRichText" :value="sampleMarkdown" />
    </LxModal>
  </div>
</template>
