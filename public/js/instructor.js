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
    return users.get(payload.userId)
  })
  .then(user => {
    console.log("user",user);
    // don't worry, we don't allow any instructor/admin-level
    // queries to be performed on the back end via REST.
    if (user.role !== "Instructor") {
      window.location.href = '/';
    }
    client.set('user', user);
    users.find({query: {$limit: 5000, $sort: {createdAt: -1}}}).then(results => {
      renderUsers(results)
    }).catch(function(err) {
      console.error(err);
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

/**********/
function renderUsers(users) {
  var row = 1;
  var utable = $("#userTable")[0];
  users.data.map(user => {
    console.log(user);
    var r = utable.insertRow(row);
    r.insertCell(0).innerHTML = row;
    r.insertCell(1).innerHTML = user.directoryID;
    r.insertCell(2).innerHTML = user.name || user.directoryID;
    r.insertCell(3).innerHTML = user.role
    r.insertCell(4).innerHTML = "Delete | Edit"
    row++;
  })
}
$(function() {
  $('#add-user').submit(function(e) {
    e.preventDefault();
    var newUser = {
      name: $('#add-user-name').val(),
      directoryID: $("#add-user-directoryid").val(),
      role: $("#add-user-role").find(":selected").text()
    };
    console.log(newUser);
    users.create(newUser).then( res => {
      $('#add-user-name').val("");
      $("#add-user-directoryid").val("");
      $("#userTable").find("tr:gt(0)").remove();
      users.find({query: {$limit: 5000}}).then(results => {
        renderUsers(results);
      }).catch(function(err) {
        console.error(err);
      });
    }).catch(function(err) {
      console.error(err);
    })
  });
});
