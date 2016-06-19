// report on JS object memory once a second
setInterval(function() {
  var mem = window.performance
    && window.performance.memory
    && window.performance.memory.usedJSHeapSize;

  console.log("Memory usage: " + mem);
}, 1000);