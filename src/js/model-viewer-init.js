// Inicializador y utilidades para @google/model-viewer
import '@google/model-viewer';

export function setupModelViewerControls(viewerElement, controlsContainer) {
  if (!viewerElement || !controlsContainer) return;

  const btnRotate = controlsContainer.querySelector('[data-action="toggle-rotate"]');
  const btnReset = controlsContainer.querySelector('[data-action="reset-camera"]');
  const btnFullscreen = controlsContainer.querySelector('[data-action="toggle-fullscreen"]');

  if (btnRotate) {
    btnRotate.addEventListener('click', () => {
      viewerElement.autoRotate = !viewerElement.autoRotate;
      btnRotate.classList.toggle('active', viewerElement.autoRotate);
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      viewerElement.cameraOrbit = '0deg 75deg 105%';
      viewerElement.fieldOfView = 'auto';
    });
  }

  if (btnFullscreen) {
    btnFullscreen.addEventListener('click', () => {
      const parent = viewerElement.closest('.model-viewer-wrapper') || viewerElement;
      if (!document.fullscreenElement) {
        parent.requestFullscreen().catch(err => console.warn(err));
      } else {
        document.exitFullscreen();
      }
    });
  }
}
