// camera.js — JARVIS Camera Module
(() => {
  const video = document.getElementById("cameraVideo");
  const placeholder = document.getElementById("cameraPlaceholder");
  const openButton = document.getElementById("openCamera");
  const flipButton = document.getElementById("flipCamera");
  const closeButton = document.getElementById("closeCamera");
  const stateLabel = document.getElementById("cameraState");
  const message = document.getElementById("cameraMessage");

  if (!video || !openButton || !flipButton || !closeButton) {
    console.warn("JARVIS Camera: Required HTML elements are missing.");
    return;
  }

  let stream = null;
  let facingMode = "user";
  let busy = false;

  function setMessage(text) {
    if (message) message.textContent = text;
  }

  function updateUI(isOn) {
    if (stateLabel) {
      stateLabel.textContent = isOn ? "CAMERA LIVE" : "CAMERA OFF";
    }

    openButton.disabled = isOn || busy;
    flipButton.disabled = !isOn || busy;
    closeButton.disabled = !isOn || busy;

    if (placeholder) placeholder.hidden = isOn;
    video.hidden = !isOn;
  }

  async function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }

    video.srcObject = null;
    updateUI(false);
  }

  async function startCamera() {
    if (busy) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage(
        "Camera unavailable. Open JARVIS using HTTPS in a supported browser."
      );
      return;
    }

    busy = true;
    updateUI(false);
    setMessage("Connecting to camera...");

    try {
      await stopCamera();

      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: facingMode }
        }
      });

      video.srcObject = stream;
      await video.play();

      updateUI(true);

      setMessage(
        facingMode === "user"
          ? "Front camera is active. Tap Flip Camera to switch."
          : "Rear camera is active. Tap Flip Camera to switch back."
      );
    } catch (error) {
      await stopCamera();

      if (error.name === "NotAllowedError") {
        setMessage("Camera permission denied. Allow camera access in browser settings.");
      } else if (error.name === "NotFoundError") {
        setMessage("No camera was found on this device.");
      } else {
        setMessage("Could not start camera. Check permissions and try again.");
      }

      console.error("JARVIS Camera Error:", error);
    } finally {
      busy = false;
      updateUI(Boolean(stream));
    }
  }

  // Open front camera
  openButton.addEventListener("click", () => {
    facingMode = "user";
    startCamera();
  });

  // Flip between front and rear cameras
  flipButton.addEventListener("click", () => {
    if (!stream || busy) return;

    facingMode =
      facingMode === "user" ? "environment" : "user";

    startCamera();
  });

  // Close camera and release hardware
  closeButton.addEventListener("click", async () => {
    if (busy) return;

    await stopCamera();
    setMessage("Camera closed. Your camera is off.");
  });

  // Release camera when leaving the page
  window.addEventListener("pagehide", () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
  });

  // Initial state: camera stays off
  updateUI(false);
  setMessage("Camera is off. Tap Open Camera to begin.");
})();