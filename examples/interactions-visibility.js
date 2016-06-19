document.addEventListener("visibilitychange", function() {
  console.log(document.hidden ? "hidden" : "visible");
}, false);