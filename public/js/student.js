// Feathers/API setup
const socket = io();
const client = feathers()
.configure(feathers.hooks())
.configure(feathers.socketio(socket))
.configure(feathers.authentication({
  cookie: 'feathers-jwt',
}));
const users = client.service('/users');
client.authenticate()
.then(response => {
  console.info("authenticated successfully");
  client.set('jwt', response.accessToken)
  return client.passport.verifyJWT(response.accessToken);
})
.then(payload => {
  console.info("verified JWT");
  // don't worry, we don't allow any instructor/admin-level
  // queries to be performed on the back end via REST.
  return users.get(payload.userId)
})
.then(user => {
  if (user.role !== "Student") {
    window.location.href = '/';
    return;
  }
  console.log("user",user);
  client.set('user', user);
  setNumTokens();
  setAvailableTAs();

})
.catch(error => {
  console.log("auth error or not authenticated, redirecting...", error);
  window.location.href = '/login.html';
});

// toastr config
toastr.options.closeDuration = 10000;
toastr.options.positionClass = "toast-bottom-right";

function logout() {
  // log out of feathers and redirect to login page
  client.logout();
  window.location.href = '/login.html';
}

function setNumTokens() {
  client.service('/numtokens').get().then(numTokens => {
    $('#num-tokens').html("You have <strong>" + numTokens.tokensRemaining + "</strong> tokens remaining.");
    return client.service('/tokens').find(
      {
        query: {
          fulfilled: false
        }
      }
    )
  }).then(unfulfilledTokens => {
      client.service('/queue-position').get().then(positionInfo => {
        if (unfulfilledTokens.total > 0) {
          hideRequestOH(positionInfo.peopleAheadOfMe+1);
        } else {
          // TODO: maybe toatr.toast here
          showRequestOH();
        }
        $("#students-in-queue").html(positionInfo.sizeOfQueue);
      }).catch(function(err) {
        console.error(err);
      })
  })
}

function submitToken() {
  client.service('/tokens').create({ desc: $("#ticket-desc").val(), passcode: $("#ticket-code").val()})
  .then(ticket => {
    setNumTokens();
    toastr.success("Your help request has been submitted!")
  })
  .catch(function (err) {
    toastr.error("Your help request could not be submitted.")
    console.error(err)
  })
}

function setAvailableTAs() {
  client.service('/availabletas').find().then(setAvailableTAsHTML);
}

// magically reactive
socket.on("availabletas updated", setAvailableTAsHTML);
socket.on("queue update", setNumTokens);

function setAvailableTAsHTML(availabletas) {
  $('#num-tas').html("" + (availabletas.total));
  $("#ta-table").find("tr").remove();
  var row = 0;
  var ttable = $("#ta-table")[0];

  if (availabletas.total == 0) {
    ttable.insertRow(row).insertCell(0).innerHTML = "No TAs hosting office hours";
  }

  availabletas.data.map(ta => {
    var r = ttable.insertRow(row);
    r.insertCell(0).innerHTML = ta.name || ta.directoryID;
    row++;
  });
}

function hideRequestOH(numInQueue) {
  $("#ticket-submit-area").hide();
  $("#ticket-no-submit").show();
  $("#ticket-queue-msg").html("You are #"+numInQueue+" in the queue");
}

function showRequestOH() {
  $("#ticket-submit-area").show();
  $("#ticket-no-submit").hide();
  $("#ticket-queue-msg").html("You are #"+0+" in the queue");
}

$(function() {
  $('#ticket-submit-form').submit(function(e) {
    e.preventDefault();
    submitToken();
  });
});

/********/
