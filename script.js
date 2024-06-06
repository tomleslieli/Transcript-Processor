function processFile() {
  const fileInput = document.getElementById("fileInput");
  const exceptionsInput = document.getElementById("exceptions");
  const file = fileInput.files[0];

  if (!file) {
    alert("Please select a file.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (event) {
    const content = event.target.result;
    const exceptions = exceptionsInput.value.split(",").map((e) => e.trim());
    const processedContent = processTranscript(content, exceptions);
    generateDownloadLink(processedContent);
  };
  reader.readAsText(file);
}

function extractLastTimecode(content) {
  const timecodeRegex = /(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/g;
  let lastTimecode = "00:00"; // Default if not found
  let match;

  while ((match = timecodeRegex.exec(content))) {
    lastTimecode = match[2]; // Get the end timecode of the last match
  }

  const parts = lastTimecode.split(":");
  return `00:${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}:00`;
}

function processTranscript(content, exceptions) {
  const endTimecode = extractLastTimecode(content);
  let processedText = content.replace(
    /\[\d{2}:\d{2}:\d{2}\]|\[.*?\]|(\d{1,2}:\d{2} - \d{1,2}:\d{2})/g,
    ""
  );

  // Protect exceptions
  let protectedText = processedText
    .split("\n")
    .map((line) => {
      exceptions.forEach((exception) => {
        const regex = new RegExp(`\\b${exception}\\b`, "gi");
        line = line.replace(regex, (match) => `EXCEPTION-${match}`);
      });
      return line;
    })
    .join("\n");

  // Apply transformations
  protectedText = protectedText
    .split("\n")
    .map((line) => {
      return line
        .trim()
        .toLowerCase()
        .replace(/\bi\b/g, "I")
        .replace(/[^\w\s?':"-]/g, ""); // Preserves specified punctuation
    })
    .filter((line) => line !== "")
    .join("\n\n");

  // Restore exceptions
  exceptions.forEach((exception) => {
    const regex = new RegExp(`EXCEPTION-${exception}`, "gi");
    protectedText = protectedText.replace(regex, exception);
  });

  // Remove the specific TurboScribe AI message
  protectedText = protectedText.replace(
    /transcribed by turboscribeai - go unlimited to remove this message/gi,
    ""
  );

  return `00:00:00:00 - ${endTimecode}\n${protectedText}`;
}

function generateDownloadLink(processedContent) {
  const blob = new Blob([processedContent], { type: "text/plain" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "processedTranscript.txt";
  a.textContent = "Download Processed Transcript";
  const container = document.getElementById("downloadLinkContainer");
  container.innerHTML = "";
  container.appendChild(a);
}
