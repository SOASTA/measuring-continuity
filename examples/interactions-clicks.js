var clicks = 0;
var lastClick = 0;
var clickTarget;

document.addEventListener("click", function(e) {
  lastClick = performance.now();
  clicks++;
  clickTarget = e.target;

  console.log("Click @ " + lastClick
    + ": " + e.target
    + " (" + clicks + " total)");
}, false);
