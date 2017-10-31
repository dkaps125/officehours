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
  refreshUsers();

})
.catch(error => {
  console.log("auth error or not authenticated, redirecting...", error);
  window.location.href = '/login.html';
});

// toastr config
toastr.options.closeDuration = 8000;
toastr.options.positionClass = "toast-bottom-right";

function logout() {
  // log out of feathers and redirect to login page
  client.logout();
  window.location.href = '/login.html';
}

/**********/
function renderUsers(users) {
  $("#userTable").find("tr:gt(0)").remove();
  var row = 1;
  var utable = $("#userTable")[0];
  users.data.map(user => {
    var r = utable.insertRow(row);
    r.insertCell(0).innerHTML = row;
    r.insertCell(1).innerHTML = user.directoryID;
    r.insertCell(2).innerHTML = user.name || user.directoryID;
    r.insertCell(3).innerHTML = user.role;
    if (client.get('user')._id !== user._id) {
      r.insertCell(4).innerHTML = '<a href="javascript:deleteUser(\''+user._id+'\')">Delete ✖</a>';
    } else {
      r.insertCell(4).innerHTML = '<a style="color:gray;">Delete ✖</a>';
    }
    //r.insertCell(4).innerHTML = '<a href="/editUser?uid='+user._id+'">Edit ✎</a> | <a href="javascript:deleteUser(\''+user._id+'\')">Delete ✖</a>'

    row++;
  })
}

function refreshUsers() {
  users.find({query: {$limit: 5000, $sort: {createdAt: -1}}}).then(results => {
    renderUsers(results);
  }).catch(function(err) {
    console.error(err);
  });
}

function deleteUser(user) {
  users.remove(user).then( res => {
    refreshUsers();
  }).catch(function(err) {
    console.log(err);
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
      refreshUsers();
    }).catch(function(err) {
      console.error(err);
    })
  });

  var uploadForm = document.getElementById('js-upload-form');

  var startUpload = function(files) {
    var form = new FormData();
    form.append('userfile', files[0]);
    $.ajax({
      url: '/csvUpload',
      type: 'POST',

      data: form,
      cache: false,
      contentType: false,
      processData: false,
      headers: {
        "Authorization": client.get('jwt'),
        //"Content-Type": "applicaiton/json"
      },
      success: function(data, textStatus, jqXHR) {
        toastr.success("Successfully created new users");
        refreshUsers();
      },
      error: function(data, textStatus, jqXHR) {
        console.log(data);
        let curErr = data.responseJSON.error.cause || "Malformed CSV"
        if (Object.keys(curErr).length === 0 && curErr.constructor === Object) {
          curErr = "Malformed CSV";
        }
        toastr.error("CSV parse error: \""+curErr+"\". Make sure the uploaded is formatted correctly and is < 5 MB")
        console.log(data, textStatus, jqXHR);
      }
    });
  };

  uploadForm.addEventListener('submit', function(e) {
    var uploadFiles = document.getElementById('js-upload-files').files;
    e.preventDefault()

    startUpload(uploadFiles)
  });

});
