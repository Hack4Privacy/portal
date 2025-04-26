import http from "@/api";

export function uploadDocx(file) {
  const formData = new FormData();
  formData.append("stream", file);

  return http().post("/parse-docx", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

export function replaceDocx(file, pattern, replacement) {
  const formData = new FormData();
  formData.append("stream", file);
  formData.append("pattern", pattern);
  formData.append("replacement", replacement);

  return http().post("/replace-docx", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

export function findSensitiveData(text) {
  // Patch: send the text as a Blob file so the backend can process it as a file
  const formData = new FormData();
  const blob = new Blob([text], { type: "text/markdown" });
  formData.append("stream", blob, "document.md");

  return http().post("/data", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}
