var keys = 0;
var lastKey;

document.addEventListener("keydown", function(e) {
  lastKey = e.key;
  keys++;
  keyTarget = e.target;

  console.log("Key @ " + lastKey
    + ": " + keyTarget
    + " (" + keys + " total)");
}, false);