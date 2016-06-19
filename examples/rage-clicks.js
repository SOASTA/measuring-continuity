var same = 0, x = 0, y = 0, targ = null;

document.addEventListener("click", function(e) {
  var nX = e.clientX; var nY = e.clientY;

  // calculate number of pixels moved
  var pixels = Math.round(
    Math.sqrt(Math.pow(y - nY, 2) +
    Math.pow(x - nX, 2)));

  if (targ == e.target || pixels <= 10) {
    same++;
  } else {
    same = 0;
  }

  console.log("Same area clicked: " + same);

  x = nX; y = nY; targ = e.target;
}, false);
