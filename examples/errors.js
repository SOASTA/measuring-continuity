var errorCount = 0;

window.onerror = function () {
  errorCount++;
}

setInterval(function() {
  console.log("Errors: " + errorCount);
  errorCount = 0;
}, 1000);