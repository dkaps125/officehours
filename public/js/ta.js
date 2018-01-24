// Feathers/API setup
const socket = io({secure: true});
const client = feathers()
.configure(feathers.hooks())
.configure(feathers.socketio(socket))
.configure(feathers.authentication({
  cookie: 'feathers-jwt',
}));

// toastr config
toastr.options.closeDuration = 12000;
toastr.options.positionClass = "toast-bottom-right";

// from remysharp.com
function throttle(fn, threshhold, scope) {
  threshhold || (threshhold = 1000);
  var last,
      deferTimer;
  return function () {
    var context = scope || this;

    var now = +new Date,
        args = arguments;
    if (last && now < last + threshhold) {
      // hold on to it
      clearTimeout(deferTimer);
      deferTimer = setTimeout(function () {
        last = now;
        fn.apply(context, args);
      }, threshhold);
    } else {
      last = now;
      fn.apply(context, args);
    }
  };
}

const users = client.service('/users');
client.authenticate()
.then(response => {
  console.info("authenticated successfully");
  client.set('jwt', response.accessToken)
  return client.passport.verifyJWT(response.accessToken);
})
.then(payload => {
  console.info("verified JWT");

  return users.get(payload.userId)
})
.then(user => {
  console.log("user",user);
  // don't worry, we don't allow any instructor/admin-level
  // queries to be performed on the back end via REST.
  if (user.role !== "Instructor" && user.role !== "TA") {
    window.location.href = '/';
  } else if (user.role === "Instructor") {
    // add link back to instructor home
    $('<li><a href="/instructor.html">Instructor Home</a></li>').insertBefore('ul.nav>li:first');
  }

  client.set('user', user);
  if (user.onDuty) {
    clockIn();
  } else {
    clockOut();
  }

  // TODO: these should only run once
  socket.on("passcode updated", function() {
    setPasscode();
    toastr.success("Passcode updated.", {timeout: 300000});
  });
  socket.on("tokens created", function(token) {
    updateStudentQueue();
    toastr.success("New ticket created");
  });
  socket.on("tokens patched", throttle(function(token) {
    updateStudentQueue();
    toastr.success("Ticket status updated");
  }));
  socket.on("availabletas updated", setAvailableTAsHTML);
  updateStudentQueue();
})
.catch(error => {
  console.log("auth error or not authenticated, redirecting...", error);
  window.location.href = '/login.html';
});

function logout() {
  // log out of feathers and redirect to login page
  client.logout();
  window.location.href = '/login.html';
}

function setPasscode() {
  client.service('passcode').get({}).then(result => {
    $("#passcode").html(result.passcode);
  });
}

function setAvailableTAsHTML(availabletas) {
  $('#num-tas').html("" + (availabletas.total));
  $("#ta-table").find("tr").remove();
  var row = 0;
  var ttable = $("#ta-table")[0];
  availabletas.data.map(ta => {
    var r = ttable.insertRow(row);
    r.insertCell(0).innerHTML = ta.name || ta.directoryID;
    row++;
  });
}

function setAvailableTAs() {
  client.service('/availabletas').find().then(availabletas => {
    setAvailableTAsHTML(availabletas);
  });
}

function updateStudentQueue() {
  client.service('/tokens').find({query: {$limit: 100, fulfilled: false}}).then(tickets => {
    $("#student-table").find("tr:gt(0)").remove();
    var row = 1;
    var stable = $("#student-table")[0];
    tickets.data.map(ticket => {
      var r = stable.insertRow(row);
      r.insertCell(0).innerHTML = row;
      r.insertCell(1).innerHTML = ticket.user.name || ticket.user.directoryID;
      r.insertCell(2).innerHTML = ticket.desc || "No description";
      r.insertCell(3).innerHTML = (new Date(ticket.createdAt)).toLocaleString();
      row++;
    });
    $("#students-in-queue").html(tickets.total);
    if (tickets.total == 0) {
      $("#student-dequeue-btn").hide();
    } else {
      $("#student-dequeue-btn").show();
    }
  });
}

function clockIn() {
  $("#student-queue-area").show();
  $("#clock-in-area").hide();
  $("#clock-out-area").show();
  setAvailableTAs();
  updateStudentQueue();
  setPasscode();
  getCurrentStudent();
}

function clockOut() {
  $("#student-queue-area").hide();
  $("#clock-in-area").show();
  $("#clock-out-area").hide();
  setAvailableTAs();
}

function dequeueStudent() {
  client.service('dequeue-student').create({})
  .then(result => {
    //console.log(result);
    getCurrentStudent();
    updateStudentQueue();
  })
  .catch(function (err) {
    console.error(err);
  })
}
var currentTicket;

function getCurrentStudent() {
  client.service('tokens').find(
    {
      query: {
        $limit: 1,
        fulfilled: true,
        isBeingHelped: true,
        fulfilledBy: client.get('user')._id,
        $sort: {
          createdAt: 1
        }
      }
    }).then((ticket) => {
      if (ticket.total >= 1) {
        currentTicket = ticket.data[0];
        showCurrentTicket(currentTicket);
      } else {
        $("#current-student-area").hide();
      }
    }).catch(function (err) {
      console.error(err);
    });
}

function showCurrentTicket(ticket) {
  client.service('tokens').find(
    {
      query: {
        $limit: 10,
        fulfilled: true,
        isBeingHelped: false,
        user: ticket.user._id,
        $sort: {
          createdAt: 1
        }
      }
    }).then(prevTickets => {
      var row = 1;
      var stable = $("#prev-tickets-table")[0];
      if ((!! prevTickets.data) && prevTickets.data.length > 0) {
        prevTickets.data.map(ticket => {
          var r = stable.insertRow(row);
          r.insertCell(0).innerHTML = row;
          r.insertCell(1).innerHTML = (new Date(ticket.closedAt)).toLocaleString();
          r.insertCell(2).innerHTML = ticket.fulfilledByName || "N/A";
          r.insertCell(3).innerHTML = ticket.desc || "No description";
          r.insertCell(4).innerHTML = "<small>Coming soon</small>"
          row++;
        });
      }
      $("#current-student-name").html("Assisting: " + ticket.user.name);
      $("#current-student-name-2").html("Recent tickets for " + ticket.user.name);
      $("#current-student-issue-text").html(ticket.desc || "No description provided");
      $("#current-student-ticket-createtime").html("Ticket created " + (new Date(ticket.createdAt)).toLocaleString());
      $("#current-student-area").show();
      console.log(prevTickets);
    }).catch(function (err) {
      console.error(err);
    });
}

function closeTicket() {
  if ((!!currentTicket) && window.confirm("Are you sure you want to permanently close this ticket?")) {
    $("#current-student-area").hide();
    console.log("patching "+currentTicket._id)
    client.service('tokens').patch(currentTicket._id, {
      isBeingHelped: false,
      isClosed: true,
      closedAt: Date.now(),
      // TODO: shouldIgnoreInTokenCount: false/true
    }).then(updatedTicket => {
      // TODO: comment service create
      client.service('comment').create({
        text:  $('#student-notes-box').val(),
        knowledgeable: $('input[name=radio1]:checked').val(),
        toldTooMuch: $('input[name=radio2]:checked').val(),
        student: currentTicket.user._id,
        ticket: currentTicket._id
      }).then(comment => {
        $('#student-notes-box').val("")
        toastr.success("Ticket closed and comment successfully saved");
        currentTicket = null;
      }).catch(function(err) {
        toastr.error("Error closing ticket and submitting comments");
        console.error(err);
        currentTicket = null;
      })
    })
  }
}

$(function() {
  $("#close-ticket-form").submit(function(e) {
    e.preventDefault();
    closeTicket();
  });
  $('#student-dequeue-form').submit(function(e) {
    e.preventDefault();
    dequeueStudent();
  });
  $('#clock-in-form').submit(function(e) {
    e.preventDefault();
    users.patch(client.get('user')._id, {onDuty: true}).then(newMe => {
      // probably better to pass in the results but this works
      toastr.success("You are now in office hours");
      clockIn();
    });
  });
  $("#clock-out-form").submit(function(e) {
    e.preventDefault();
    users.patch(client.get('user')._id, {onDuty: false})
    .then(newMe => {
      toastr.success("You are logged out of office hours");
      clockOut();
    });
  });
});
