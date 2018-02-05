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

const users = client.service('/users');
var currentPage = 0;
var itemsPerPage = 15;
var pagesLoaded = [];
var allTickets = [];

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
  updateTicketList(currentPage, []);

  // TODO: these should only run once
  socket.on("passcode updated", function() {
    toastr.success("Passcode updated.", {timeout: 300000});
  });
  socket.on("tokens created", function(token) {
    toastr.success("New ticket created");
    //updateTicketList(currentPage);
  });
  socket.on("tokens patched", function() {
    toastr.success("Ticket status updated");
    //updateTicketList(currentPage);
  });
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

function updateTicketList(page, tokenQuery) {
  console.log("updating ticket list for page "+page)
  if (pagesLoaded.includes(page)) {
    console.log("page already loaded");
    currentPage -= 1;
    return;
  }
  pagesLoaded.push(page);

  var q = {};

  if (tokenQuery.length === 0) {
    q = {
      query: {
        $limit: itemsPerPage,
        $skip: page * itemsPerPage,
        $sort: {
          createdAt: -1
        }
      }
    };
  } else {
    q = {
      query: {
        $limit: itemsPerPage,
        $skip: page * itemsPerPage,
        $sort: {
          createdAt: -1
        },
        $or: tokenQuery
      }
    }
  }

  client.service('/tokens').find(q).then(tickets => {
    //$("#ticket-list").find("tr:gt(0)").remove();

    if (tickets.data.length < itemsPerPage) {
      currentPage -= 1;
    }

    var row = 1 + page * itemsPerPage;
    var stable = $("#ticket-list")[0];
    tickets.data.map(ticket => {
      var r = stable.insertRow(row);
      ticket.curStatus = ticket.isClosed ? "Closed" :
        (!ticket.fulfilled ? "Queued" :
        (!ticket.cancelledByStudent ? "In progress" : "Cancelled"))
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
    allTickets = allTickets.concat(tickets);
    $("#all-tickets-label").html("All tickets ("+tickets.total+")");
  });
}

function setModal(ticket) {
  var finalHTML = '';
  finalHTML += '<h4>Ticket status: <span style="color:gray">' + ticket.curStatus + '</span></h4>';
  finalHTML += '<p> Description: </p> <div class="well">' + (ticket.desc || "No description") +"</div>";
  if (ticket.fulfilled && !ticket.cancelledByStudent) {
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
    finalHTML += "<hr><h4> This ticket was cancelled by the student</h4>";
  }

  $("#ticket-modal-body").html(finalHTML);
}

const tokens = client.service('/tokens');
let tokenQuery = [];
let timeOutID = null;

function searchTokens() {
  if (timeOutID !== null) {
    clearTimeout(timeOutID);
  }

  timeOutID = setTimeout(() => {
    var input, filter, table, tr, td, i;
    input = document.getElementById("searchBox");
    filter = input.value.toUpperCase();
    table = document.getElementById("ticket-list");
    tr = table.getElementsByTagName("tr");

    if (filter === "") {
      tokenQuery = [];
    } else {
      tokenQuery = [
          { desc: { $search: filter } },
          { fulfilledByName: { $search: filter } }
      ];
    }

    currentPage = 0;
    pagesLoaded = [];
    $("#ticket-list").hide();
    $("#ticket-list").find("tr:gt(0)").remove();

    updateTicketList(currentPage, tokenQuery);
    $("#ticket-list").show();
  }, 100);
}

$(document).ready(function() {
  $(window).scroll(function() {
   if($(window).scrollTop() + $(window).height() == $(document).height()) {
     currentPage += 1;
     // we load too fast otherwise
     setTimeout(function() {
       updateTicketList(currentPage, tokenQuery);
     }, 200);
   }
  });
});
