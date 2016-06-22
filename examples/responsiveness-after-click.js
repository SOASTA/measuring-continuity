document.addEventListener("click", function(e) {
  var start = performance.now();
  requestAnimationFrame(function() {
     var delta = performance.now() - start;
     console.log("Click responsiveness: " + delta);
  });
}, false);
