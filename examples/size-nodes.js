var d = document;

setInterval(function() {
  console.log(
    "DOM Size: " + d.documentElement.innerHTML.length + "b " +
    "Nodes: " + d.getElementsByTagName("*").length + " " +
    "Docs: " + d.getElementsByTagName("iframe").length + " " +
    "IMG: " + d.getElementsByTagName("img").length + " " +
    "SCRIPT: " + d.getElementsByTagName("script").length);
}, 1000);