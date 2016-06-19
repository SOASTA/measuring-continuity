var resources =
  window.performance.getEntriesByType("resource");

// number of resources fetched
var resourceCount = resources.length;

// number of bytes
var bytesOverWire = 0;
resources.forEach(function(res) {
  bytesOverWire +=
    res.transferSize ? res.transferSize : 0;
});

console.log("Resources: " + resourceCount
  + " " + bytesOverWire + "b");