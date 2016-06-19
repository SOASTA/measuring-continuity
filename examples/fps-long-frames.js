var lastFrame = performance.now();
var longFrames = 0;

function measureFps() {
  var now = performance.now();

  // calculate how long this frame took
  if (now - lastFrame >= 18) { longFrames++; }

  lastFrame = now;

  window.requestAnimationFrame(measureFps);
}
window.requestAnimationFrame(measureFps);

// report on long frames once a second
setInterval(function() {
  console.log("Long frames: " + longFrames);
  longFrames = 0;
}, 1000);
