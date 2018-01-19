// Feathers/API setup
const socket = io({secure: true});
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

var lastTotal = 0;
var numTokens = -1;
var lastTicketCancelled = false;

function setNumTokens() {
  client.service('/numtokens').get().then(res => {
    numTokens = res.tokensRemaining;

    $('#num-tokens').html("You have <strong>" + numTokens + "</strong> tokens remaining.");
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
          lastTotal = unfulfilledTokens.total;
          hideRequestOH(positionInfo.peopleAheadOfMe+1);
        } else {
          if (unfulfilledTokens.total == 0 && lastTotal > 0 && !lastTicketCancelled) {
            toastr.success("You have been dequeued by a TA!", {timeout: 15000});
          }
          lastTotal = unfulfilledTokens.total;
          lastTicketCancelled = false;
          showRequestOH();
        }
        $("#students-in-queue").html(positionInfo.sizeOfQueue);
      })
      .catch(function(err) {
        console.error(err);
      })
  })
}

function submitToken() {
  client.service('/tokens').create({
    desc: $("#ticket-desc").val(),
    passcode: $("#ticket-code").val()
  })
  .then(ticket => {
    setNumTokens();
    toastr.success("Your help request has been submitted!")
  })
  .catch(function (err) {
    var errMsg = "Your help request could not be submitted: ";
    if (numTokens <= 0) {
      errMsg += "You are out of tokens."
    } else {
      errMsg += (!!err.message) ? err.message+"." : "" ;
    }
    toastr.error(errMsg);
  })
}

function setAvailableTAs() {
  client.service('/availabletas').find().then(setAvailableTAsHTML);
}

function cancelRequest() {
  client.service('/tokens').find({
    query: {
      fulfilled: false
    }
  }).then((tickets) => {
      if (tickets.total == 0) {
        toastr.warning("There are no open tickets that can be cancelled");
      } else {
        // if the student has multiple tickets open for some reason, kill them all
        tickets.data.map(ticket => {
          client.service('/tokens').patch(ticket._id, {
            fulfilled: true,
            cancelledByStudent: true
          }).then(ticket => {
            lastTicketCancelled = true
            toastr.warning("Your help ticket has cancelled")
            setNumTokens()
          }).catch( function (err) {
            toastr.error((!!err.message) ? err.message : "Cannot cancel ticket")
          })
        })
      }
  })
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
    ttable.insertRow(row).insertCell(0).innerHTML = '<small class="text-muted">No TAs are currently hosting office hours</small>';
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
  $('#cancel-req').click(function(e) {
    cancelRequest();
  })
});

/********/
