<script setup>
import {
  findSensitiveData,
  uploadDocx,
  replaceDocx,
} from "@/services/fileService";
import useNotifyStore from "@/stores/useNotifyStore";
import { useVuelidate } from "@vuelidate/core";
import { required } from "@vuelidate/validators";
import {
  LxExpander,
  LxFileUploader,
  LxForm,
  LxLoaderView,
  LxModal,
  LxRow,
  LxValuePicker,
} from "@wntr/lx-ui";
import { computed, onMounted, ref } from "vue";

const notify = useNotifyStore();

const rules = computed(() => ({
  selectedCategories: { required },
  uploadedFile: { required },
}));
const request = ref({
  selectedCategories: [
    "Personal ID codes, Social security numbers",
    "Names, Surnames",
    "Email addresses",
    "IP addresses",
  ],
  uploadedFile: null,
});
const v = useVuelidate(rules, request);
const categories = ref([
  {
    id: "Personal ID codes, Social security numbers",
    name: "Personal ID codes",
  },
  {
    id: "Names, Surnames",
    name: "Names, Surnames",
  },
  {
    id: "Phone numbers",
    name: "Phone numbers",
  },
  {
    id: "Email addresses",
    name: "Email addresses",
  },
  {
    id: "Full addresses or Location data",
    name: "Full addresses",
  },
  {
    id: "Bank account numbers",
    name: "Bank account numbers",
  },
  {
    id: "Credit card numbers",
    name: "Credit card numbers",
  },
  {
    id: "Passport or ID document numbers",
    name: "Passport or ID document numbers",
  },
  {
    id: "Medical records or health information",
    name: "Medical records or health information",
  },
  {
    id: "Financial information",
    name: "Financial information",
  },
  {
    id: "Biometric data reference",
    name: "Biometric data references",
  },
  {
    id: "IP addresses",
    name: "IP addresses",
  },
  {
    id: "Login credentials",
    name: "Login credentials",
  },
]);

const expanderOpen = ref(true);
const resultExpanderOpen = ref(true);
const storedFileText = ref("");

const resultModal = ref(null);
const filterCategoriesText = computed(() => {
  const total = categories.value.length;
  const selected = request.value.selectedCategories.length;
  return `Select sensitive data types to scan for (${selected} of ${total})`;
});

const detectedSensitiveDataText = computed(() => {
  const findings = sensitiveDataFound.value.data?.personal_data_found || [];
  const counts = { high: 0, medium: 0, low: 0 };

  findings.forEach((item) => {
    if (!item.sensitivity || !item.values) return;
    const key = item.sensitivity.toLowerCase();
    if (counts[key] !== undefined) {
      counts[key] += item.values.length;
    }
  });

  const parts = [];
  if (counts.high) parts.push(`high: ${counts.high}`);
  if (counts.medium) parts.push(`medium: ${counts.medium}`);
  if (counts.low) parts.push(`low: ${counts.low}`);

  return parts.length ? `Detected data (${parts.join(", ")})` : "Detected data";
});

const uploading = ref(false);
const processing = ref(false);
const actionDefinitions = computed(() => [
  {
    id: "sanitize",
    name: "Sanitize",
    icon: "search",
    kind: "primary",
    busy: uploading.value,
  },
]);
const sensitiveDataFound = ref({
  data: {
    contains_personal_data: false,
    personal_data_found: [{ sensitivity: "", type: "", values: [] }],
  },
});

async function actionClicked(actionId) {
  if (actionId === "sanitize") {
    const isFormCorrect = await v.value.$validate();
    if (!isFormCorrect) {
      notify.pushError(
        "Please select at least one data category and select a document to sanitize",
      );
      return;
    }

    try {
      uploading.value = true;
      const response = await uploadDocx(request.value.uploadedFile[0].content);
      uploading.value = false;

      processing.value = true;
      resultModal.value.open();
      storedFileText.value = response.data.text;
      const sensitiveData = await findSensitiveData(
        response.data.text,
        request.value.selectedCategories,
      );
      processing.value = false;
      sensitiveDataFound.value = sensitiveData.data;
    } catch (error) {
      notify.pushError(
        "Processing error",
        "An error occurred while processing the document. Please try again later.",
      );
      return;
    } finally {
      v.value.$reset();
      processing.value = false;
      uploading.value = false;
    }
  }
}

function firstErrorMessage(errors) {
  if (errors && errors.length > 0) {
    return errors[0].$message;
  }
  return "";
}

async function handleSanitizedFileDownload() {
  try {
    const file = request.value.uploadedFile[0].content;
    // Use the sensitiveDataFound data as replacements
    const replacements =
      sensitiveDataFound.value.data.personal_data_found || [];
    const response = await replaceDocx(file, replacements);
    const blob =
      response.data instanceof Blob
        ? response.data
        : new Blob([response.data], {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sanitized_document.docx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    notify.pushError(
      "Download error",
      "An error occurred while downloading the sanitized document. Please try again later.",
    );
  }
}

onMounted(async () => {
  document
    .querySelectorAll(
      '[aria-label="Ievadiet nosaukuma daļu, lai sameklētu vērtības"]',
    )
    .forEach((input) => {
      input.setAttribute(
        "placeholder",
        "Search for data categories to scan...",
      );
    });
});

const sortedFindings = computed(() => {
  if (
    !sensitiveDataFound.value.data ||
    !Array.isArray(sensitiveDataFound.value.data.personal_data_found)
  ) {
    return [];
  }
  const priority = { High: 1, Medium: 2, Low: 3 };
  return [...sensitiveDataFound.value.data.personal_data_found]
    .filter(
      (item) =>
        item.sensitivity && item.type && item.values && item.values.length,
    )
    .sort(
      (a, b) =>
        (priority[a.sensitivity] || 99) - (priority[b.sensitivity] || 99),
    );
});
</script>

<template>
  <div class="dashboard-container">
    <aside class="dashboard-sidebar">
      <h2>How this tool works</h2>
      <p>
        This is a demo implementation of Oopsie Guard. It's a proof of concept,
        the actual underlying technology can be implemented in various ways -
        directly into existing workflows and systems or as a standalone tool.
      </p>
      <ul>
        <li>Upload your document on the right</li>
        <li>Select sensitive data types to scan for</li>
        <li>
          Click Sanitize to preview detected data and download the sanitized
          document
        </li>
      </ul>
      <br />
      <h2>What is Oopsie Guard?</h2>
      <p>
        Oopsie Guard's service is an elastic, easily adaptable and configurable
        solution for sensitive data detection and sanitization needs.
        <br />
        <br />
        We provide an easy-to-use interface for integration wherever you need
        it.
      </p>
    </aside>
    <main class="dashboard-main">
      <LxForm
        :column-count="1"
        :show-header="false"
        @button-click="actionClicked"
        :action-definitions="actionDefinitions"
        class="dashboard-form"
      >
        <LxRow label="Document">
          <LxFileUploader
            kind="single"
            v-model="request.uploadedFile"
            draggable
            class="file-drop-area"
            label-id="file-drop-area"
            :allowed-file-extensions="['.docx']"
            :show-meta="false"
          />
        </LxRow>
        <LxExpander
          v-model="expanderOpen"
          :label="filterCategoriesText"
          icon="filter"
        >
          <LxRow
            class="data-categories"
            style="--color-content-switcher-foreground: #3370b5"
          >
            <LxValuePicker
              label="Data categories"
              :has-search="true"
              :items="categories"
              variant="tags"
              v-model="request.selectedCategories"
              kind="multiple"
              :has-select-all="true"
              :invalid="v.selectedCategories.$errors?.length > 0"
              :invalidation-message="
                firstErrorMessage(v.selectedCategories.$errors)
              "
            />
          </LxRow>
        </LxExpander>
      </LxForm>
      <LxModal
        size="s"
        id="documentPreviewModal"
        ref="resultModal"
        :label="processing ? 'Processing document...' : 'Result'"
        :button-primary-visible="
          !processing && !!sensitiveDataFound.data.contains_personal_data
        "
        button-primary-label="Download sanitized document"
        @primary-action="handleSanitizedFileDownload"
      >
        <LxLoaderView
          :loading="processing"
          :label="'Processing...'"
          :description="'Please wait while document is being processed'"
        >
          <div v-if="!sensitiveDataFound.data.contains_personal_data">
            <div class="modal-state-container">
              <svg class="icon" viewBox="0 0 64 64" width="128" height="128">
                <circle cx="32" cy="32" r="30" fill="#e6f9ed" />
                <path
                  d="M20 32l8 8 16-16"
                  stroke="#2ecc71"
                  stroke-width="5"
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <div>
                <div class="success-text">No sensitive data found!</div>
                <p>
                  We didn't find any sensitive data in the document. This is not
                  a guarantee that the document is free of sensitive data, but
                  it is a good indication that the document is safe to share.
                  <br />
                  <br />
                </p>
              </div>
            </div>
          </div>
          <div v-else>
            <div class="modal-state-container">
              <svg class="icon" viewBox="0 0 64 64" width="74" height="74">
                <circle cx="32" cy="32" r="30" fill="#ffe4e4" />
                <path
                  d="M20 20l24 24M20 44l24-24"
                  stroke="#e74c3c"
                  stroke-width="5"
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <div>
                <div class="failure-text">Sensitive data found!</div>
                <p>
                  The document contains sensitive data. Please review the
                  detected data and download the sanitized document.
                  <br />
                  <br />
                </p>
              </div>
            </div>

            <strong>Note:</strong> The formating of the document may be slightly
            altered during the sanitization process.
            <br />
            <br />

            <LxExpander
              v-model="resultExpanderOpen"
              :label="detectedSensitiveDataText"
            >
              <div class="sensitive-blocks">
                <div
                  v-for="(item, index) in sortedFindings"
                  :key="index"
                  :class="['sensitive-block', item.sensitivity.toLowerCase()]"
                >
                  <div class="block-header">
                    <span class="block-sensitivity">{{
                      item.sensitivity
                    }}</span>
                    <span class="block-type">{{ item.type }}</span>
                  </div>
                  <ul class="block-values">
                    <li v-for="(value, vIdx) in item.values" :key="vIdx">
                      {{ value }}
                    </li>
                  </ul>
                </div>
              </div>
            </LxExpander>
          </div>
        </LxLoaderView>
      </LxModal>
    </main>
  </div>
</template>

<style scoped>
.dashboard-container {
  position: relative;
  display: flex;
  background: #f8f9fb;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  margin-top: 1.5rem;
}

.dashboard-sidebar {
  flex: 0 0 320px;
  background: #fff;
  padding: 2.5rem 2rem 2rem 2rem;
  border-right: 1px solid #ececec;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.dashboard-sidebar h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #2d3a4a;
}

.dashboard-sidebar p {
  color: #5a6a7a;
  margin-bottom: 1.5rem;
}

.dashboard-sidebar ul {
  color: #4a5a6a;
  padding-left: 1.2em;
  margin: 0;
}

.dashboard-main {
  flex: 1 1 0;
  padding: 2.5rem 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f8f9fb;
}

.dashboard-form {
  width: 100%;
  max-width: 540px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
  padding: 0;
  overflow: auto;
}

.file-drop-area {
  border: 2px dashed #b6c2d1;
  border-radius: 8px;
  padding: 2.5rem 1rem 1.5rem 1rem;
  background: #f4f7fa;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  margin-top: 0.5rem;
}

.file-drop-text {
  color: #7a8ca3;
  font-size: 0.95rem;
  margin-top: 0.75rem;
}

:global(.lx-form-section) {
  display: block !important;
}

/* At this point I don't care, there's no attribute controlling this */
:global(.lx-draggable-upload-wrapper > p) {
  font-size: 0px;
}

:global(.lx-draggable-upload-wrapper > p::before) {
  content: "Drag and drop your file here";
  font-size: 1rem;
}

.modal-state-container {
  display: flex;
  gap: 1.5rem;
}

@media (max-width: 900px) {
  .dashboard-container {
    flex-direction: column;
  }

  .dashboard-sidebar {
    border-right: none;
    border-bottom: 1px solid #ececec;
    flex: none;
    width: 100%;
    padding: 1.5rem 1rem;
  }

  .dashboard-main {
    padding: 1.5rem 1rem;
  }

  .dashboard-form {
    padding: 0;
  }
}

.modal-state {
  text-align: center;
}

.icon {
  margin: 0 auto;
}

.success-text {
  margin-top: 1rem;
  font-size: 1.2rem;
  color: #2ecc71;
}

.failure-text {
  font-size: 1.2rem;
  color: #e74c3c;
}

.sensitive-blocks {
  margin-top: 1rem;
}

.sensitive-block {
  margin-bottom: 1rem;
  padding: 1rem;
  border-radius: 8px;
  color: #fff;
}

.sensitive-block.high {
  background-color: #e74c3c;
}

.sensitive-block.medium {
  background-color: #f39c12;
}

.sensitive-block.low {
  background-color: #3498db;
}

.block-header {
  display: flex;
  justify-content: space-between;
}

.block-sensitivity {
  font-weight: bold;
}

.block-type {
  font-style: italic;
}

.block-values {
  list-style-type: none;
  padding: 0;
}
</style>
