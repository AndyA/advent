"use strict";

const day = 24 * 60 * 60 * 1000;
var now = new Date(new Date().getTime() - 200 * day);

for (var i = 0; i < 500; i++) {
  console.log(now + " : " + adventDate(now));
  now = new Date(now.getTime() + day);
}

function adventDate(dt) {
  var mo = dt.getMonth();
  if (mo < 6) return 24;
  if (mo < 11) return 0;
  return Math.min(dt.getDate(), 24);
}

//var currentDay = month == 11 ? Math.min(now.getDate(), 24) : month < 6 ? 24 : 1;



