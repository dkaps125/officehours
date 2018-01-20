// Feathers/API setup
const socket = io({secure: true});
const client = feathers()
.configure(feathers.hooks())
.configure(feathers.socketio(socket))
.configure(feathers.authentication({
  cookie: 'feathers-jwt',
}));

// toastr config
toastr.options.closeDuration = 10000;
toastr.options.positionClass = "toast-bottom-right";

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

  socket.on("passcode updated", function() {
    setPasscode();
    toastr.success("Passcode updated.", {timeout: 30000});
  });
  socket.on("tokens created", function(token) {
    updateStudentQueue();
    toastr.success("New ticket created");
  });
  socket.on("tokens patched", function(token) {
    updateStudentQueue();
    toastr.success("Ticket status updated");
  });
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
  $("#footer").show();
  setAvailableTAs();
  updateStudentQueue();
  setPasscode();
}

function clockOut() {
  $("#student-queue-area").hide();
  $("#clock-in-area").show();
  $("#footer").hide();
  setAvailableTAs();
}

function dequeueStudent() {
  client.service('dequeue-student').create({}).then(result => {
    //console.log(result);
    updateStudentQueue();
  }).catch(function (err) {
    console.log(err);
  })
}

$(function() {
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
