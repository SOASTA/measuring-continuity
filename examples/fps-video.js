var latestFrame = 0;
var latestReportedFrame = 0;

setInterval(function() {
  // find the first VIDEO element on the page
  var vids = document.getElementsByTagName("video");
  if (vids && vids.length) {
    var vid = vids[0];
      if (vid.webkitDecodedFrameCount) {
        latestFrame = vid.webkitDecodedFrameCount;
    }
  }

  console.log("Video FPS: "
    + Math.max(latestFrame - latestReportedFrame, 0));

  // reset count
  latestReportedFrame = latestFrame;
}, 1000);
