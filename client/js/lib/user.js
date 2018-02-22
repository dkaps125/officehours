// Feathers/API setup
const socket = io({secure: true});
const client = feathers()
.configure(feathers.hooks())
.configure(feathers.socketio(socket))
.configure(feathers.authentication({
  cookie: 'feathers-jwt',
}));
const users = client.service('/users');

var curUser = undefined;
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

  socket.on("tokens created", function(token) {
    toastr.success("New ticket created");
  });
  socket.on("tokens patched", function(token) {
    toastr.success("Ticket status updated");
  });

  // extract user
  const qUser = getUrlParameter('id');
  if (!qUser || !qUser.length || qUser.length != USER_ID_LEN) {
    displayUserErr();
    return;
  }
  client.service('/users').get(qUser)
  .then(user => {
    if (user.role !== 'Student' && (client.get('user').role === 'TA')) {
      displayUserErr();
      return;
    }
    curUser = user;
    displayUser(user);
    updateStats(user);
    renderTicketList(user);
  })
  .catch(err => {
    console.error(err);
    displayUserErr();
  });
})
.catch(error => {
  console.log("auth error or not authenticated, redirecting...", error);
  window.location.href = '/login.html';
});

const USER_ID_LEN = 24;

// toastr config
toastr.options.closeDuration = 8000;
toastr.options.positionClass = "toast-bottom-right";

function logout() {
  // log out of feathers and redirect to login page
  //client.logout();
  //window.location.href = '/login.html';
}

/**********/
// stats
function updateStats(curUser) {
  const lastMidnight = new Date();
  lastMidnight.setHours(0,0,0,0);
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  $("#student-stats").hide();
  $("#ta-stats").hide();

  if (!curUser) {
    return;
  }

  if (curUser.role === "Student") {
    client.service('/tokens').find({
      query: {
        user: curUser._id,
        createdAt: {
          $gt: lastMidnight.getTime(),
        },
        $limit: 0,
      }
    }).then(res => {
      $("#stats-tix-today").html(res.total);
      return client.service('/tokens').find({
        query: {
          user: curUser._id,
          createdAt: {
            $gt: lastWeek.getTime(),
          },
          $limit: 0,
        }
      }).then(res => {
        $("#stats-tix-week").html(res.total);
        return client.service('/tokens').find({
          query: {
            user: curUser._id,
            $limit: 0,
          }
        });
      }).then(res => {
        $("#stats-tix-total").html(res.total);
        $("#student-stats").show();
      }).catch(function(err) {
        console.err(err);
      });
    });
  } else {
    $("#stats-role-header").html(curUser.role+" statistics")
    return client.service('/tokens').find({
      query: {
        fulfilledBy: curUser._id,
        createdAt: {
          $gt: lastWeek.getTime(),
        },
        $limit: 0,
      }
    }).then(res => {
      $("#stats-ta-tix-week").html(res.total);
      return client.service('/tokens').find({
        query: {
          fulfilledBy: curUser._id,
          $limit: 0,
        }
      });
    }).then(res => {
      $("#stats-ta-tix-total").html(res.total);
      $("#ta-stats").show();
    }).catch(function(err) {
      console.err(err);
    });
  }
}

function displayUserErr() {
  $("#user-info").hide();
  $("#user-notfound").show();
}

function displayUser(user) {
  $("#user-info").show();
  $("#user-notfound").hide();
  // Render
  $.each($(".user-name"), (i,e) => {
    $(e).html(user.name);
  });
  $.each($(".user-id"), (i,e) => {
    $(e).html(user.directoryID);
  });
  $.each($(".user-role"), (i,e) => {
    $(e).html(user.role);
  });
  if (client.get('user').role === "TA") {
    $.each($(".instr-only"), (i,e) => {
      $(e).hide();
    })
  }
  $("#edit-user-name").val(user.name);
  $("#edit-user-id").val(user.directoryID);
  $("#edit-user-role").val(user.role)
}

function deleteUser() {
  if (window.confirm("Are you sure you want to permanently delete this user?")) {
    client.service('/users').remove(curUser._id)
    .then(res => {
      toastr.success("User successfully removed");
      $("user-info").hide();
      $("user-notfound").show();
    }).catch(err => {
      toastr.error("Error removing user");
      console.error(err);
    });
  }
}

function renderTicketList(user) {
  const tokens = client.service('/tokens');

  var query = {
    $limit: 1000,
    $sort: {
      createdAt: -1
    },
    user: user._id
  };

  if (user.role !== "Student") {
    query = {
      $limit: 1000,
      $sort: {
        createdAt: -1
      },
      fulfilledBy: user._id
    };
  }

  tokens.find({
    query
  }).then(tickets => {
    // Ripped from tickets.js. TODO: pull this out into its own module
    var row = 1;
    var stable = $("#ticket-list")[0];
    tickets.data.map(ticket => {
      var r = stable.insertRow(row);

      if (ticket.isClosed) {
        if (ticket.noShow) {
          ticket.curStatus = "No-Show";
        } else if (ticket.cancelledByTA) {
          ticket.curStatus = "Canceled (TA)";
        } else {
          ticket.curStatus = "Closed";
        }
      } else {
        if (!ticket.fulfilled) {
          ticket.curStatus = "Queued";
        } else if (!ticket.cancelledByStudent) {
          ticket.curStatus = "In Progress";
        } else {
          ticket.curStatus = "Canceled";
        }
      }
      r.insertCell(0).innerHTML = row;
      r.insertCell(1).innerHTML = ticket.curStatus;
      r.insertCell(2).innerHTML = ticket.user.name || ticket.user.directoryID;
      r.insertCell(3).innerHTML = (new Date(ticket.createdAt)).toLocaleString();
      r.insertCell(4).innerHTML = !!ticket.fulfilledByName ? ticket.fulfilledByName : "";
      r.insertCell(5).innerHTML = ticket.desc || "No description";
      $(r).css("cursor", "pointer");
      $(r).attr("data-toggle", "modal");
      $(r).attr("data-target", "#ticket-modal")
      const pos = row;
      $(r).click(function() {
        $("#ticket-modal-label").text("#" + pos +": "
          + (ticket.user.name || ticket.user.directoryID)
          + " on " + (new Date(ticket.createdAt)).toLocaleString());
        setModal(ticket);
      });
      row++;
    });
  })

}

// also ripped straight from tickets.js
// TODO: we should pull this out into util
function setModal(ticket) {
  var finalHTML = '';
  finalHTML += '<h4>Ticket status: <span style="color:gray">' + ticket.curStatus + '</span></h4>';
  finalHTML += '<p> Description: </p> <div class="well">' + (ticket.desc || "No description") +"</div>";
  if (ticket.fulfilled && !ticket.cancelledByStudent && !ticket.noShow) {
    // TODO: link to TA stats for this TA somehow
    finalHTML += '<hr><h5 style="display:inline-block;">Responding TA:</h5> ' + ticket.fulfilledByName + "<br>"
    if (ticket.isClosed) {
      finalHTML += '<h5 style="display:inline-block;">Ticket closed on:</h5> ' + (new Date(ticket.closedAt)).toLocaleString() + "<br>";
      if (!!ticket.comment) {
        finalHTML += '<h5 style="display:inline-block;">Student was knowledgeable:</h5> ' + ticket.comment.knowledgeable + '<br>' ;
        finalHTML += '<h5 style="display:inline-block;">Student could have solved problem with less help:</h5> ' + ticket.comment.toldTooMuch + '<br>';
        finalHTML += '<br><p>TA Notes:</p><div class="well">' + (!!ticket.comment.text ? ticket.comment.text : "No notes") + '</div>';
        // if we turn on extra tokens, put text for that here
      } else {
        finalHTML += '<br><h5>Comments not available</h5>';
      }
    }
  } else if (ticket.cancelledByStudent) {
    finalHTML += '<hr><h4> This ticket was canceled by the student</h4>';
  } else if (ticket.noShow) {
    finalHTML += '<h4> Student was not present</h4>';
    finalHTML += '<hr><h5 style="display:inline-block;">Responding TA:</h5> ' + ticket.fulfilledByName + "<br>"
  }

  $("#ticket-modal-body").html(finalHTML);
}


$(function() {
  // Delete user button
  $('#delete-user').click(deleteUser);

  // Add user button
  $('#edit-user').submit(function(e) {
    e.preventDefault();
    users.patch(curUser._id, {
      name: $('#edit-user-name').val(),
      directoryID: $("#edit-user-directoryid").val(),
      role: $("#edit-user-role").find(":selected").text()
    }).then(res => {
      console.log("user patched");
      toastr.success("User has been updated");
    }).catch(err => {
      console.err(err);
      toastr.error("Error updating user");
    });
    // refreshUsers();
  });
});

function search() {
  var input, filter, table, tr, td, i;
  input = document.getElementById("searchBox");
  filter = input.value.toUpperCase();
  table = document.getElementById("userTable");
  tr = table.getElementsByTagName("tr");

  for (i = 0; i < tr.length; i++) {
    td = tr[i].getElementsByTagName("td")[2];
    if (td) {
      if (td.innerHTML.toUpperCase().indexOf(filter) > -1) {
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    }
  }

  $('html, body').animate({
    scrollTop: ($('#searchBox').offset().top)
  },100);
}
