// total frames seen this second
var frames = 0;

function measureFps() {
  frames++;

  // request a callback before the next frame
  window.requestAnimationFrame(measureFps);
}

// start measuring
window.requestAnimationFrame(measureFps);

// report on frame rate (FPS) once a second
setInterval(function() {
  console.log("FPS: " + frames);
  frames = 0;
}, 1000);