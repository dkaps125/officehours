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
  console.log("user",user);
  client.set('user', user);
  setNumTokens();
  setAvailableTAs();

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
        }
        $("#students-in-queue").html(positionInfo.sizeOfQueue);
      }).catch(function(err) {
        console.error(err);
      })
  })
}

function submitToken() {
  client.service('/tokens').create({ desc: $("#ticket-desc").val()})
  .then(ticket => {
    hideRequestOH(2);
    setNumTokens();
  })
  .catch(function (err) {
    //TODO: toastr
    console.error(err)
  })
}

function setAvailableTAs() {
  client.service('/availabletas').find().then(availabletas => {
    $('#num-tas').html("" + (availabletas.total));
    var row = 0;
    var ttable = $("#ta-table")[0];
    availabletas.data.map(ta => {
      var r = ttable.insertRow(row);
      r.insertCell(0).innerHTML = ta.name || ta.directoryID;
      row++;
    });
  });
}

function hideRequestOH(numInQueue) {
  $("#ticket-submit-area").hide();
  $("#ticket-no-submit").show();
  $("#ticket-queue-msg").html("You are #"+numInQueue+" in the queue");
}

$(function() {
  $('#ticket-submit-form').submit(function(e) {
    e.preventDefault();
    submitToken();
  });
});

/********/
