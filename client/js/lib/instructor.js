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
  updateStats();

  socket.on("tokens created", function(token) {
    updateStudentQueue();
    toastr.success("New ticket created");
  });
  socket.on("tokens patched", function(token) {
    updateStudentQueue();
    toastr.success("Ticket status updated");
  });
  updateStudentQueue();
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
function updateStudentQueue() {
  client.service('/tokens').find({query:
    {
      $limit: 100,
      fulfilled: false,
    }
  }).then(tickets => {
    $("#student-table").find("tr:gt(0)").remove();
    var row = 1;
    var stable = $("#student-table")[0];
    tickets.data.map(ticket => {
      var r = stable.insertRow(row);
      r.insertCell(0).innerHTML = row;
      r.insertCell(1).innerHTML = ticket.user.name || ticket.user.directoryID;
      r.insertCell(2).innerHTML = ticket.desc || "No description";
      var dateCell = r.insertCell(3);
      dateCell.innerHTML = (formatTime(new Date(ticket.createdAt)));
      dateCell.classList.add("time");
      dateCell.dataset.time = new Date(ticket.createdAt);
      row++;
    });
    $("#students-in-queue").html(tickets.total);
    $("#students-in-queue-sm").html(tickets.total);
  });
}

function renderUsers(users) {
  $("#userTable").find("tr:gt(0)").remove();
  var row = 1;
  var utable = $("#userTable")[0];
  users.data.map(user => {
    var r = utable.insertRow(row);
    /*$(r).click(() => {
      window.location.href = genUserURL(user);
    });*/
    r.insertCell(0).innerHTML = row;
    r.insertCell(1).innerHTML = genUserElt(user, user.directoryID);
    r.insertCell(2).innerHTML = genUserElt(user, user.name || user.directoryID);
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
  if (window.confirm("Are you sure you want to permanently delete this user?")) {
    users.remove(user).then( res => {
      toastr.success("User successfully removed");
      refreshUsers();
    }).catch(function(err) {
      toastr.error("Error removing user");
      console.error(err);
    })
  }
}

function deleteAllStudents() {
  if (window.confirm("Are you sure you want to permanently delete ALL students?")) {
    deleteAllWithRole("Student");
  }
}

function deleteAllTAs() {
  if (window.confirm("Are you sure you want to permanently delete ALL TA's?")) {
    deleteAllWithRole("TA");
  }
}

function deleteAllWithRole(role) {
  users.remove(null, {
    query: {
      role: role
    }
  }).then( res => {
    refreshUsers();
  }).catch(function(err) {
    console.error(err);
  });
}

// stats
function updateStats() {
  const lastMidnight = new Date();
  lastMidnight.setHours(0,0,0,0);
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  $("#student-stats-well").hide();

  client.service('tokens').find({
    query: {
      _aggregate: [{
        $match: {
          noShow: false,
          cancelledByTA: false,
          cancelledByStudent: false,
          fulfilled: true,
          isBeingHelped: false
        },
      },
      {
        $group: {
          _id: null,
          waitAvg: { $avg: { $subtract: ["$dequeuedAt", "$createdAt"]} },
          sessAvg: { $avg: { $subtract: ["$closedAt", "$dequeuedAt"]} }
        }
      }]
    }
  }).then(toks => {
    if (toks.length > 0) {
      $("#stats-wait-avg").html(millisToTime(toks[0].waitAvg));
      $("#minutes-session").html(millisToTime(toks[0].sessAvg));
    }
    var getAvgTicketsWeekTAs = client.service('/tokens').find({
        query: {
          _aggregate: [
            {
              $match: {
                noShow: false,
                cancelledByTA: false,
                cancelledByStudent: false,
                fulfilled: true,
                isBeingHelped: false
              }
            },
            {
              $project: {
                 year: { $year: "$createdAt" },
                 week: { $week: "$createdAt" },
               }
            },
            {
              $group: {
              _id: { year: "$year", week:"$week" },
              total : { $sum: 1 }
            }},
            {
              $group: {
              _id: null,
              avgTotal: {$avg: "$total"}
              }
            }
          ]
      }
    }).then(res => {
      $("#sessions-week").html(res.length > 0 ? precisionRoundDecimals(res[0].avgTotal) : "N/A");
    })

    // Top students
    client.service('users').find({
      query: {
        totalTickets: {
          $gt: 0,
        },
        $sort: {
          totalTickets: -1
        },
        $limit: 10,
        role: 'Student'
      }
    }).then(res => {
      // TODO: put this in a $project
      $("#top-student-table").find("tr:gt(0)").remove();
      var row = 0;
      var stable = $("#top-student-table")[0];
      var allPromises = [];

      for (var i = 0; i < res.data.length; i++) {
        const user = res.data[i];
        /* total per week
        var getTokenCount = client.service('/tokens').find({
          query: {
            user: user._id,
            createdAt: {
              $gt: new Date(new Date() - 7 * 60 * 60 * 24 * 1000)
            },
            $limit: 0
          }
        });
        */
        var getAvgTicketsWeek = client.service('/tokens').find({
            query: {
              _aggregate: [{
        		    $match: {
        			     user: user._id
        		    }},{
        		      $project: {
        			       year: { $year: "$createdAt" },
        			       week: { $week: "$createdAt" },
        		       }
                },
        		    {
                  $group: {
                  _id: { year: "$year", week:"$week", user: "$user" },
                  total : { $sum: 1 }
                }},
                {
                  $group: {
                  _id: null,
                  avgTotal: {$avg: "$total"}
                  }
                }
              ]
        	}
        });
        var getLastToken = client.service('/tokens').find({
          query: {
            user: user._id,
            $limit:1,
            $sort: {
              createdAt: -1
            }
          }
        });

        allPromises.push(Promise.all([getAvgTicketsWeek, getLastToken]));
        row++;
      }
      // force order
      Promise.all(allPromises).then(allResults => {
        for (var i = 0; i < allResults.length; i++) {
          const avgTicketsWeek = allResults[i][0];
          const getLastToken = allResults[i][1];
          const user = res.data[i];
          var r = stable.insertRow(i+1);
          r.insertCell(0).innerHTML = genUserElt(user, user.name);
          r.insertCell(1).innerHTML = user.totalTickets;
          r.insertCell(2).innerHTML = avgTicketsWeek.length > 0 ? precisionRoundDecimals(avgTicketsWeek[0].avgTotal, 3) || "N/A" : "N/A";
          r.insertCell(3).innerHTML = (getLastToken.total >= 1) ? formatTime(getLastToken.data[0].createdAt) : "N/A";
        }
      });
    }).catch(err => {
      console.log(err);
    });

    client.service('users').find({
      query: {
        totalTickets: {
          $gt: 0,
        },
        $sort: {
          totalTickets: -1
        },
        $limit: 10,
        $or: [
          { role: 'TA' },
          { role: 'Instructor' }
        ]
      }
    }).then(res => {
      $("#top-ta-table").find("tr:gt(0)").remove();
      var row = 0;
      var ttable = $("#top-ta-table")[0];
      var allPromises = [];

      for (var i = 0; i < res.data.length; i++) {
        const user = res.data[i];
        /*var getTokenCount = client.service('/tokens').find({
          query: {
            fulfilledBy: user._id,
            createdAt: {
              $gt: new Date(new Date() - 7 * 60 * 60 * 24 * 1000)
            },
            $limit: 0
          }
        });
        */
        var getAvgTicketsWeek = client.service('/tokens').find({
            query: {
              _aggregate: [{
        		    $match: {
        			     fulfilledBy: user._id,
                   fulfilled: true,
                   isBeingHelped: false
        		    }},{
        		      $project: {
        			       year: { $year: "$createdAt" },
        			       week: { $week: "$createdAt" },
        		       }
                },
        		    {
                  $group: {
                  _id: { year: "$year", week:"$week", fulfilledBy: "$fulfilledBy" },
                  total : { $sum: 1 }
                }},
                {
                  $group: {
                  _id: null,
                  avgTotal: {$avg: "$total"}
                  }
                }
              ]
        	}
        });
        var getLastToken = client.service('/tokens').find({
          query: {
            fulfilledBy: user._id,
            $limit:1,
            $sort: {
              closedAt: -1
            }
          }
        });
        allPromises.push(Promise.all([getAvgTicketsWeek, getLastToken]))
      }
      // force order
      Promise.all(allPromises).then(allResults => {
        for (var i = 0; i < allResults.length; i++) {
          const avgTicketsWeek = allResults[i][0];
          const getLastToken = allResults[i][1];
          const user = res.data[i];
          var r = ttable.insertRow(i+1);
          r.insertCell(0).innerHTML = genUserElt(user, user.name);
          r.insertCell(1).innerHTML = user.totalTickets;
          r.insertCell(2).innerHTML = avgTicketsWeek.length > 0 ? precisionRoundDecimals(avgTicketsWeek[0].avgTotal, 3) || "N/A" : "N/A";
          r.insertCell(3).innerHTML = (getLastToken.total >= 1) ? formatTime(getLastToken.data[0].closedAt) : "N/A";
        }
      });
    }).catch(err => {
      console.log(err);
    });
  });

  client.service('users').find({
    query: {
        $or: [{ role: "Instructor" }, { role: "TA" }],
        $limit: 0
    }
  }).then(res => {
    $("#num-tas").html(res.total);
  }).catch(err => {
    console.log(err);
  });

  client.service('/tokens').find({
    query: {
      createdAt: {
        $gt: lastMidnight.getTime(),
      },
      $limit: 0,
    }
  }).then(res => {
    $("#stats-tix-today").html(res.total);
    return client.service('/tokens').find({
      query: {
        createdAt: {
          $gt: lastWeek.getTime(),
        },
        $limit: 0,
      }
    }).then(res => {
      $("#stats-tix-week").html(res.total);
      return client.service('/tokens').find({
        query: {
          $limit: 0,
        }
      });
    }).then(res => {
      $("#stats-tix-total").html(res.total);
      $("#student-stats-well").show();
    }).catch(function(err) {
      console.err(err);
    })
  });

  if (!cfg.statsGraph) {
    $('#stats').hide();
    return;
  }

  client.service('tokens').find({
    query: {
      $limit: 1000
    }
  }).then(res => {
    var data = {};
    var students = {};
    var tas = {};

    res.data.forEach(ele => {
      var key = precisionRoundWhole(new Date(ele.createdAt).getTime(), 5);

      if (data.hasOwnProperty(key)) {
        data[key] += 1;
      } else {
        data[key] = 1;
      }
    });

    data = toDataArray(data);
    console.log(data);

    var svg = d3.select("svg"),
        margin = {top: 20, right: 20, bottom: 110, left: 40},
        margin2 = {top: 430, right: 20, bottom: 30, left: 40},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom,
        height2 = +svg.attr("height") - margin2.top - margin2.bottom;

    var parseDate = d3.timeParse("%b %Y");

    var x = d3.scaleTime().range([0, width]),
        x2 = d3.scaleTime().range([0, width]),
        y = d3.scaleLinear().range([height, 0]),
        y2 = d3.scaleLinear().range([height2, 0]);

    var xAxis = d3.axisBottom(x),
        xAxis2 = d3.axisBottom(x2),
        yAxis = d3.axisLeft(y);

    var brush = d3.brushX()
        .extent([[0, 0], [width, height2]])
        .on("brush end", brushed);

    var zoom = d3.zoom()
        .scaleExtent([1, Infinity])
        .translateExtent([[0, 0], [width, height]])
        .extent([[0, 0], [width, height]])
        .on("zoom", zoomed);

    var area = d3.area()
        .curve(d3.curveMonotoneX)
        .x(function(d) { return x(d.date); })
        .y0(height)
        .y1(function(d) { return y(d.y); });

    var area2 = d3.area()
        .curve(d3.curveMonotoneX)
        .x(function(d) { return x2(d.date); })
        .y0(height2)
        .y1(function(d) { return y2(d.y); });

    svg.append("defs").append("clipPath")
        .attr("id", "clip")
      .append("rect")
        .attr("width", width)
        .attr("height", height * 300);

    var focus = svg.append("g")
        .attr("class", "focus")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var context = svg.append("g")
        .attr("class", "context")
        .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

      x.domain(d3.extent(data, function(d) { return d.date; }));
      y.domain([0, d3.max(data, function(d) { return d.y; })]);
      x2.domain(x.domain());
      y2.domain(y.domain());

      focus.append("path")
          .datum(data)
          .attr("class", "area")
          .attr("d", area);

      focus.append("g")
          .attr("class", "axis axis--x")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis);

      focus.append("g")
          .attr("class", "axis axis--y")
          .call(yAxis);

      context.append("path")
          .datum(data)
          .attr("class", "area")
          .attr("d", area2);

      context.append("g")
          .attr("class", "axis axis--x")
          .attr("transform", "translate(0," + height2 + ")")
          .call(xAxis2);

      context.append("g")
          .attr("class", "brush")
          .call(brush)
          .call(brush.move, x.range());

      svg.append("rect")
          .attr("class", "zoom")
          .attr("width", width)
          .attr("height", height)
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
          .call(zoom);

    function brushed() {
      if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
      var s = d3.event.selection || x2.range();
      x.domain(s.map(x2.invert, x2));
      focus.select(".area").attr("d", area);
      focus.select(".axis--x").call(xAxis);
      svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
          .scale(width / (s[1] - s[0]))
          .translate(-s[0], 0));
    }

    function zoomed() {
      if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
      var t = d3.event.transform;
      x.domain(t.rescaleX(x2).domain());
      focus.select(".area").attr("d", area);
      focus.select(".axis--x").call(xAxis);
      context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
    }
  }).catch(err => {
    console.log(err);
  })
  // TODO: Graph generation here

}

$(function() {
  // Delete all students button
  $('#delete-all-students').click(deleteAllStudents);

  // Delete all TAs button
  $('#delete-all-tas').click(deleteAllTAs);

  // Add user button
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

  // Upload form
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

  // Scroll navbar
  var navItems = [];
  navItems[0] = $("#live-queue").position().top;
  navItems[1] = $("#student-stats").position().top;
  navItems[2] = $("#ta-stats").position().top;
  navItems[3] = $("#manage-user").position().top;
  navItems[4] = $("#roster").position().top;

  var navListSm = [];
  navListSm[0] = $("#live-queue-nav-sm");
  navListSm[1] = $("#student-stats-nav-sm");
  navListSm[2] = $("#ta-stats-nav-sm");
  navListSm[3] = $("#manage-user-nav-sm");
  navListSm[4] = $("#roster-nav-sm");

  var navListLg = [];
  navListLg[0] = $("#live-queue-nav-lg");
  navListLg[1] = $("#student-stats-nav-lg");
  navListLg[2] = $("#ta-stats-nav-lg");
  navListLg[3] = $("#manage-user-nav-lg");
  navListLg[4] = $("#roster-nav-lg");

  var selected = 0;

  $(document).ready(function() {
    $(window).scroll(function() {
      const scrollLoc = $(this).scrollTop();
      var newSelected = 0;
      if (scrollLoc >= 0 && scrollLoc < navItems[1]) {
        newSelected = 0;
      } else if (scrollLoc >= navItems[1] && scrollLoc < navItems[2]) {
        newSelected = 1;
      } else if (scrollLoc >= navItems[2] && scrollLoc < navItems[3]) {
        newSelected = 2;
      } else if (scrollLoc >= navItems[3] && scrollLoc < navItems[4]) {
        newSelected = 3;
      } else if (scrollLoc >= navItems[4]) {
        newSelected = 4;
      }

      if (newSelected != selected) {
        navListLg[selected].removeClass("active");
        navListSm[selected].removeClass("active");
        selected = newSelected;
        navListLg[selected].addClass("active");
        navListSm[selected].addClass("active");
      }
    });
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

function sortTable(n) {
  var sortOrder = parseInt(document.getElementById("userTable").dataset.sortorder);
  document.getElementById("userTable").dataset.sortorder = -sortOrder + "";

  var field = "createdAt";

  if (n === 1) {
    field = "directoryID";
  } else if (n === 2) {
    field = "name";
  } else if (n === 3) {
    field = "role";
  }

  var searchQuery = {query: {$limit: 5000, $sort: {}}};
  searchQuery.query.$sort[field] = sortOrder;

  users.find(searchQuery).then(results => {
    renderUsers(results);
  }).catch(function(err) {
    console.error(err);
  });
}
