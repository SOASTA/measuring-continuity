setInterval(function() {
  navigator.getBattery().then(function(batt) {
    console.log(batt.level);
  });
}, 1000);
