var d = document;
var mutationCount = 0;
var domLength =
  d.getElementsByTagName("*").length;

// create an observer instance
var observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if (mutation.type !== "childList") { return; }
    for (var i = 0; i < mutation.addedNodes.length; i++) {
      var node = mutation.addedNodes[i];
      mutationCount++;
      mutationCount += node.getElementsByTagName ?
        node.getElementsByTagName("*").length : 0;
    }
  });
});

// configure the observer
observer.observe(d, { childList: true, subtree: true });

setInterval(function() {
  // report as % of DOM size
  var deltaPct = Math.round(
    mutationCount / domLength * 100);

  console.log("Mutations: " + mutationCount
    + " (" + deltaPct + "%)");

  mutationCount = 0;
  domLength = d.getElementsByTagName("*").length;
}, 1000);

