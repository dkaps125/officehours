import React from 'react';
import Utils from '../../Utils';

class StudentStats extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      topStudents: [],
      topTas: [],
      numTas: -1,
      numTicketsToday: -1,
      numTicketsThisWeek: -1,
      numTicketsTotal: -1,
      waitAvg: -1,
      sessAvg: -1,
      taSessionsPerWeek: -1,

    };

    const user = props.client.get('user');
    const socket = props.client.get('socket');

  }

  componentDidMount() {
    const client = this.props.client;
    const socket = client.get('socket');
    this.updateStats();

  }

  componentDidUpdate(prevProps, prevState) {

  }

  toastAndUpdate = (msg, cb) => {
    toastr.success(msg);
    cb();
  }

  // this is a monster
  updateStats = () => {
    const lastMidnight = new Date();
    lastMidnight.setHours(0,0,0,0);
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const client = this.props.client;

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
        //$("#stats-wait-avg").html(millisToTime(toks[0].waitAvg));
        //$("#minutes-session").html(millisToTime(toks[0].sessAvg));
        this.setState({waitAvg: Utils.millisToTime(toks[0].waitAvg)});
        this.setState({sessAvg: Utils.millisToTime(toks[0].sessAvg)});
      }
      return client.service('/tokens').find({
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
        });
      }).then(res => {
        //$("#sessions-week").html(res.length > 0 ? precisionRoundDecimals(res[0].avgTotal) : "N/A");
        this.setState({taSessionsPerWeek: res[0].avgTotal});
        return client.service('users').find({
          query: {
              $or: [{ role: "Instructor" }, { role: "TA" }],
              $limit: 0
          }
        })
      }).then(res => {
        this.setState({numTas: res.total});

        return client.service('/tokens').find({
          query: {
            createdAt: {
              $gt: lastMidnight.getTime(),
            },
            $limit: 0,
          }
        })
      }).then(res => {
        this.setState({numTicketsToday: res.total});
        return client.service('/tokens').find({
          query: {
            createdAt: {
              $gt: lastWeek.getTime(),
            },
            $limit: 0,
          }
        })
      }).then(res => {
        this.setState({numTicketsThisWeek: res.total});
        return client.service('/tokens').find({
          query: {
            $limit: 0,
          }
        });
      }).then(res => {
        this.setState({numTicketsTotal: res.total});
        // Top students
        return client.service('users').find({
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
        })
      }).then(res => {
        var allPromises = [];
        for (var i = 0; i < res.data.length; i++) {
          const user = res.data[i];
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
          var topStudents = [];
          for (var i = 0; i < allResults.length; i++) {
            const user = res.data[i];
            const name = Utils.genUserElt(user, user.name);
            const totalTickets = user.totalTickets;
            const getAvgTicketsWeek = allResults[i][0];
            const getLastToken = allResults[i][1];
            const avgTicketsWeek = getAvgTicketsWeek.length > 0 ? precisionRoundDecimals(getAvgTicketsWeek[0].avgTotal, 3) || "N/A" : "N/A";
            const lastTicketDate = (getLastToken.total >= 1) ? formatTime(getLastToken.data[0].closedAt) : "N/A";
            topStudents[i] = {user, name, totalTickets, avgTicketsWeek, lastTicketDate};
          }
          this.setState({topStudents});
        });

        return client.service('users').find({
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
        });
      }).then(res => {
        var allPromises = [];
        for (var i = 0; i < res.data.length; i++) {
          const user = res.data[i];
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
          var topTas = [];
          for (var i = 0; i < allResults.length; i++) {
            const user = res.data[i];
            const name = Utils.genUserElt(user, user.name);
            const totalTickets = user.totalTickets;
            const getAvgTicketsWeek = allResults[i][0];
            const getLastToken = allResults[i][1];
            const avgTicketsWeek = getAvgTicketsWeek.length > 0 ? precisionRoundDecimals(getAvgTicketsWeek[0].avgTotal, 3) || "N/A" : "N/A";
            const lastTicketDate = (getLastToken.total >= 1) ? formatTime(getLastToken.data[0].closedAt) : "N/A";
            topTas[i] = {user, name, totalTickets, avgTicketsWeek, lastTicketDate};
          }
          this.setState({topTas});
        });
      }).catch(err => {
        console.log(err);
      });
    }

    updateQueueCount = () => {
      const client = this.props.client;
      client.service('/tokens').find({query:
        {
          $limit: 0,
          fulfilled: false,
        }
      }).then(tickets => {
        console.log({studentsInQueue: tickets.total})
        this.setState({studentsInQueue: tickets.total});
      }).catch(console.error);
    }

    render() {
      return (
        <div>
          <h3>Student statistics</h3>
          <div className="well stats">
            <div className="statsBlock">
              <div className="statsPanel">
                <div>
                  {this.state.numTicketsTotal >= 0 ?
                  this.state.numTicketsTotal : <span>N/A</span>}
                </div>
              </div>
              <div className="statsFooter">
                <p className="statsText lead">Tickets (total)</p>
              </div>
            </div>
            <div className="statsBlock">
              <div className="statsPanel">
                <div>
                  {this.state.numTicketsThisWeek >= 0 ?
                  this.state.numTicketsThisWeek : <span>N/A</span>}
                </div>
              </div>
              <div className="statsFooter">
                <p className="statsText lead">Tickets (1 week)</p>
              </div>
            </div>
            <div className="statsBlock">
              <div className="statsPanel">
                <div>
                  {this.state.numTicketsToday >= 0 ?
                  this.state.numTicketsToday : <span>N/A</span>}
                </div>
              </div>
              <div className="statsFooter">
                <p className="statsText lead">Tickets (today)</p>
              </div>
            </div>
            <div className="statsBlock">
              <div className="statsPanel">
                <div>{this.state.waitAvg}</div>
              </div>
              <div className="statsFooter">
                <p className="statsText lead">Avg Wait (mins)</p>
              </div>
            </div>
          </div>
          <table className="table">
            <thead>
              <tr className="active">
                <th>Name</th>
                <th>Total tickets</th>
                <th>Avg tickets/week</th>
                <th>Last ticket date</th>
              </tr>
            </thead>
            <tbody>
              {
                this.state.topStudents.length > 0 ?
                this.state.topStudents.map((student, row) => {
                  return <tr key={row}>
                    <td>{student.name}</td>
                    <td>{student.totalTickets}</td>
                    <td>{student.avgTicketsWeek}</td>
                    <td>{student.lastTicketDate}</td>
                  </tr>
                }) : <tr><td style={{color: "gray"}}>No statistics</td></tr>
              }
            </tbody>
          </table>

          <hr />
          <h3>TA Statistics</h3>
          <div className="well stats">
            <div className="statsBlock">
              <div className="statsPanel">
                <div>
                  {this.state.numTas >= 0 ?
                  this.state.numTas : <span>N/A</span>}
                </div>
              </div>
              <div className="statsFooter">
                <p className="statsText lead">TAs</p>
              </div>
            </div>
            <div className="statsBlock">
              <div className="statsPanel">
                <div>
                  {this.state.sessAvg}
                </div>
              </div>
              <div className="statsFooter">
                <p className="statsText lead">Mins/session</p>
              </div>
            </div>
            <div className="statsBlock">
              <div className="statsPanel">
                <div>
                  {this.state.taSessionsPerWeek >= 0 ?
                  this.state.taSessionsPerWeek : <span>N/A</span>}
                </div>
              </div>
              <div className="statsFooter">
                <p className="statsText lead">Sessions/week</p>
              </div>
            </div>
          </div>
          <table className="table">
            <thead>
              <tr className="active">
                <th>Name</th>
                <th>Total tickets</th>
                <th>Avg tickets/week</th>
                <th>Last closed ticket</th>
              </tr>
            </thead>
            <tbody>
              {
                this.state.topTas.length > 0 ?
                this.state.topTas.map((ta, row) => {
                  return <tr key={row}>
                    <td>{ta.name}</td>
                    <td>{ta.totalTickets}</td>
                    <td>{ta.avgTicketsWeek}</td>
                    <td>{ta.lastTicketDate}</td>
                  </tr>
                }) : <tr><td style={{color: "gray"}}>No statistics</td></tr>
              }
            </tbody>
          </table>
        </div>
      )

    }
  }

  export default StudentStats;
