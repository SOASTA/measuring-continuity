var x = 0; var y = 0;
var mousePct = 0;
var mousePx = 0;

var screenPx =
  Math.round(Math.sqrt(Math.pow(window.innerHeight, 2) +
  Math.pow(window.innerWidth, 2)));

document.addEventListener("mousemove", function(e) {
  var nX = e.clientX; var nY = e.clientY;

  // calculate number of pixels moved
  var pixels = Math.round(
    Math.sqrt(Math.pow(y - nY, 2) +
    Math.pow(x - nX, 2)));

  // calculate percentage of screen moved
  mousePx += pixels;
  mousePct += Math.round(pixels / screenPx * 100);

  x = nX; y = nY;
}, false);

setInterval(function() {
  console.log("Mouse moved " + mousePx + "px"
    + " (" + mousePct + "%)");
  mousePct = 0; mousePx = 0;
}, 1000);