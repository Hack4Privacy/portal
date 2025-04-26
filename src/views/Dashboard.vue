<script setup>
import {
  LxExpander,
  LxFileUploader,
  LxForm,
  LxModal,
  LxRichTextDisplay,
  LxRow,
  LxValuePicker,
} from "@wntr/lx-ui";
import { ref, computed, onMounted, watch } from "vue";
import { uploadDocx, findSensitiveData } from "@/services/fileService";

const categories = ref([
  {
    id: "personCode",
    name: "Personal ID codes",
  },
  {
    id: "namesSurnames",
    name: "Names, Surnames",
  },
  {
    id: "phoneNumbers",
    name: "Phone numbers",
  },
  {
    id: "emailAddresses",
    name: "Email addresses",
  },
  {
    id: "fullAddresses",
    name: "Full addresses",
  },
  {
    id: "bankAccountNumbers",
    name: "Bank account numbers",
  },
  {
    id: "creditCardNumbers",
    name: "Credit card numbers",
  },
  {
    id: "passportNumbers",
    name: "Passport or ID document numbers",
  },
  {
    id: "socialSecurityNumbers",
    name: "Social security numbers",
  },
  {
    id: "medicalRecords",
    name: "Medical records or health information",
  },
  {
    id: "financialInformation",
    name: "Financial information",
  },
  {
    id: "locationData",
    name: "Location data",
  },
  {
    id: "biometricData",
    name: "Biometric data references",
  },
  {
    id: "ipAddresses",
    name: "IP addresses",
  },
  {
    id: "loginCredentials",
    name: "Login credentials",
  },
]);

const selectedCategory = ref([
  "personCode",
  "socialSecurityNumbers",
  "medicalRecords",
  "creditCardNumbers",
  "bankAccountNumbers",
  "loginCredentials",
  "biometricData",
]);

const expanderOpen = ref(true);
const uploadedFile = ref(null);

const sampleMarkdown = ref("");
const documentPreviewModal = ref(null);
const filterCategoriesText = computed(() => {
  const total = categories.value.length;
  const selected = selectedCategory.value.length;
  return `Select sensitive data types to scan for (${selected} of ${total})`;
});

function actionClicked(actionId) {
  if (actionId === "sanitize") {
    documentPreviewModal.value.open();

    uploadDocx(uploadedFile.value[0].content)
      .then((response) => {
        console.log("File uploaded successfully:", response);
        findSensitiveData(response.data.text);
      })
      .then((sensitiveData) => {
        console.log("Sensitive data found:", sensitiveData);
      })
      .catch((error) => {
        console.error("Error sanitizing document:", error);
      });
  }
}

watch(
  () => uploadedFile.value,
  (newFile) => {
    console.log("File uploaded:", newFile);
  },
);

onMounted(async () => {
  try {
    const response = await fetch("/sample.md");
    sampleMarkdown.value = await response.text();
  } catch (error) {
    console.error("Failed to load sample markdown:", error);
  }
});
</script>

<template>
  <div class="dashboard-container">
    <aside class="dashboard-sidebar">
      <h2>How this tool works</h2>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque
        euismod, nisi eu consectetur consectetur, nisl nisi consectetur nisi, eu
        consectetur nisl nisi euismod nisi.
      </p>
      <ul>
        <li>Upload your document on the right</li>
        <li>Select sensitive data types to scan for</li>
        <li>
          Click Sanitize to preview detected data and download the sanitized
          document
        </li>
      </ul>
    </aside>
    <main class="dashboard-main">
      <LxForm
        :column-count="1"
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
        class="dashboard-form"
      >
        <LxRow label="Document">
          <LxFileUploader
            v-model="uploadedFile"
            draggable
            class="file-drop-area"
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
              v-model="selectedCategory"
              kind="multiple"
              :has-select-all="true"
            />
          </LxRow>
        </LxExpander>
      </LxForm>
      <LxModal
        size="l"
        id="documentPreviewModal"
        ref="documentPreviewModal"
        label="Reviewing document..."
      >
        <LxRichTextDisplay
          id="documentPreviewRichText"
          :value="sampleMarkdown"
        />
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
</style>
