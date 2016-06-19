var POLLING_INTERVAL = 25;    // ms
var ALLOWED_DEVIATION_MS = 4; // ms
var REPORT_INTERVAL = 1000;   // ms
var POLLS_PER_REPORT =
    REPORT_INTERVAL / POLLING_INTERVAL;

var last = performance.now(); // when we ran last
var total = 0;         // total callbacks
var late = 0;          // late callbacks

setInterval(function() {
  var now = performance.now();
  var delta = now - last;
  last = now;

  // if we're more than 2x the polling interval
  // + deviation, we missed one period completely
  while (delta > ((POLLING_INTERVAL * 2)
    + ALLOWED_DEVIATION_MS)) {
    total++;
    late++;
    delta -= POLLING_INTERVAL; // adjust, try again
  }

  total++;

  if (delta > (POLLING_INTERVAL + ALLOWED_DEVIATION_MS)) {
    late++;
  }
}, POLLING_INTERVAL);

setInterval(function() {
  // if we had more polls than we expect in each
  // collection period, we must not have been able
  // to report, so assume those periods were 100%
  while (total > POLLS_PER_REPORT) {
    console.log("Page Busy: 100%");

    // reset the period by one
    total -= POLLS_PER_REPORT;
    late -= Math.max(POLLS_PER_REPORT, 0);
  }

  console.log("Page Busy: "
    + Math.round(late / total * 100) + "%")

  total = 0;
  late = 0;
}, REPORT_INTERVAL);
