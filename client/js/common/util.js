// Notifications
var hasPermissions = false;
var notifyDing = undefined;

var reqNotificationPermission = function() {
  if("Notification" in window) {
    notifyDing = new Audio('/ding.ogg');
    Notification.requestPermission().then(function (permission) {
      hasPermissions = (permission === "granted");
    });
  }
}

var pushNotification = function(title, text) {
  if (!title) {
    title = "Office hours";
  }
  if (!!notifyDing) {
    notifyDing.play();
  }
  return new Notification(title, {"body":text});
}

// util
function getUrlParameter(name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  var results = regex.exec(location.search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

function genUserElt(user, text) {
  return '<a href="/user.html?id='+(user._id || user)+'">'+text+'</a>';
}

function genUserURL(user) {
  return '/user.html?id='+(user._id || user);
}

// Time
var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

var formatTime = function(date) {
    date = new Date(date);

    var t = new Date();
    var now = new Date(t.getTime() - t.getTimezoneOffset() * 60000);

    var then = new Date(date.getTime() - date.getTimezoneOffset() * 60000);

    if (now.getFullYear() !== then.getFullYear()) {
        return months[then.getMonth()] + ' ' + then.getDate() + ', ' + then.getFullYear();
    }

    var diff = now - then;

    var seconds = parseInt(diff / 1000);
    var minutes = parseInt(seconds / 60);
    var hours = parseInt(minutes / 60);
    var days = parseInt(hours / 24);

    if (seconds < 60) {
        return seconds + ' second' + (seconds === 1 ? '' : 's') + ' ago';
    } else if (minutes < 60) {
        return minutes + ' minute' + (minutes === 1 ? '' : 's') + ' ago';
    } else if (hours < 24) {
        return hours + ' hour' + (hours === 1 ? '' : 's') + ' ago';
    } else if (days < 7) {
        return days + ' day' + (days === 1 ? '' : 's') + ' ago';
    } else if (days === 7) {
        return 'One week ago';
    } else {
        return months[then.getMonth()] + ' ' + then.getDate();
    }
}

setInterval(function() {
  Array.from(document.getElementsByClassName("time")).map(ele => {
    ele.innerHTML = formatTime(ele.dataset.time)
  });

  Array.from(document.getElementsByClassName("timeSmall")).map(ele => {
    ele.innerHTML = '<small>' + formatTime(ele.dataset.time) + '</small>';
  });
}, 1000);

var precisionRoundDecimals = function(number, precision = 1) {
  var factor = Math.pow(10, precision);
  return Math.round(number * factor) / factor;
}

var precisionRoundWhole = function(number, precision = 1) {
  var factor = Math.pow(10, precision);
  return Math.round(number / factor) * factor;
}

var millisToTime = function(t) {
  t = t / 60000;
  const ret = precisionRoundDecimals(t, 1);
  return ret > 999 ? ">999" : ret;
}

var toDataArray = function(hash) {
  var t = [];

  for (var k in hash) {
    t.push({x: parseInt(k), y: hash[k], date: new Date(parseInt(k))});
  }

  return t;
}
