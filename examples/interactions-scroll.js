var lastY = 0;     // last scroll Y
var maxY = 0;      // max scroll Y
var scrollPct = 0; // scroll % this period

window.addEventListener("scroll", function() {
  var curY = window.scrollY;

  var height = document.body.scrollHeight
    - window.innerHeight;

  var diffY = Math.abs(lastY - curY);

  maxY = Max(curY, maxY);

  // calculate percentage of document scrolled
  console.log("Scrolled " + diffY + "px ("
    + Math.round(diffY / height * 100) + "%)");

  lastY = curY;
}, false);
