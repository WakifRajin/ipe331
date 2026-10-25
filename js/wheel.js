// One wheel rule for every 3D stage: a plain wheel always scrolls the page; Ctrl/⌘ + wheel (which is also what a
// trackpad pinch sends) zooms the model. A plain wheel over a stage briefly shows a hint saying so.
export function guardWheel(canvas, stage, controls) {
  controls.enableZoom = true;
  const hint = document.createElement('div');
  hint.className = 'zoom-hint';
  hint.textContent = /Mac|iPhone|iPad/.test(navigator.platform) ? 'Use ⌘ + scroll or pinch to zoom' : 'Use Ctrl + scroll or pinch to zoom';
  hint.setAttribute('aria-hidden', 'true');
  stage.append(hint);
  let timer = 0;
  // Capture phase on the canvas runs before OrbitControls' own wheel listener.
  const onWheel = (e) => {
    if (e.ctrlKey || e.metaKey) return; // let OrbitControls zoom (it calls preventDefault)
    e.stopImmediatePropagation(); // OrbitControls never sees it, and the page scrolls normally
    hint.classList.add('is-on');
    clearTimeout(timer);
    timer = setTimeout(() => hint.classList.remove('is-on'), 1100);
  };
  canvas.addEventListener('wheel', onWheel, { capture: true });
  return () => {
    canvas.removeEventListener('wheel', onWheel, { capture: true });
    clearTimeout(timer);
    hint.remove();
  };
}

// Zoom by a factor toward the orbit target (used by the + / − buttons).
export function zoomBy(camera, controls, factor) {
  const offset = camera.position.clone().sub(controls.target);
  const len = Math.min(Math.max(offset.length() * factor, controls.minDistance || 0.01), controls.maxDistance || Infinity);
  camera.position.copy(controls.target).add(offset.setLength(len));
  controls.update();
}
