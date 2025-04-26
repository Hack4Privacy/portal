import http from "@/api";

export function uploadDocx(file) {
  const formData = new FormData();
  formData.append("stream", file);

  return http().post("/parse/docx", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

export function replaceDocx(file, replacements) {
  const formData = new FormData();
  formData.append("stream", file);
  formData.append("data", JSON.stringify(replacements));

  return http().post("/redact/docx", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    responseType: "blob", // Ensure we get a Blob for file download
  });
}

export function findSensitiveData(text, categories) {
  // Patch: send the text as a Blob file so the backend can process it as a file
  const formData = new FormData();
  const blob = new Blob([text], { type: "text/markdown" });
  formData.append("stream", blob, "document.md");
  formData.append("categories", categories);

  return http().post("/data", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}
