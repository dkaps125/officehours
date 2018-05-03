import React from 'react';
import AvailableTas from '../AvailableTas';
import QueuedStudentsTable from '../QueuedStudentsTable';
import Comments from './Comments.jsx';
import Utils from '../../Utils';

class Ta extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      onDuty: false,
      numTas: 0,
      studentsInQueue: 0,
      studentQueue: [],
      currentTicket: null
    };

    const user = props.client.get('user');
    const socket = props.client.get('socket');

    // Don't toast because QueuedStudentsTable toasts for us
    socket.on('tokens created', this.updateQueueCount);
    socket.on('tokens patched', this.updateQueueCount);

    if (!! user) {
      this.state.onDuty = user.onDuty;
      this.setPasscode();
      this.getCurrentStudent();
    }
    this.updateQueueCount();
  }

  componentDidMount() {
    const client = this.props.client;
    const socket = client.get('socket');
    this.setState({numTas: 1});

    // if loaded early
    socket.on('authWithUser', user => {
      this.setState({onDuty: user.onDuty});
      // this would be better if we used flux or redux
    });
  }

  componentDidUpdate(prevProps, prevState) {
    // onDuty status updated
    if (!prevState.onDuty && this.state.onDuty) {
      this.setPasscode();
      this.getCurrentStudent();
    } else if (prevState.onDuty && !this.state.onDuty) {
      this.setState({passcode: null});
    }
  }

  toastAndUpdate = (msg, cb) => {
    toastr.success(msg);
    cb();
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

  cancelAllTix = () => {
    console.log("end oh");
  }

  toggleOH = () => {
    const client = this.props.client;
    const onDuty = !this.state.onDuty;
    client.service('/users').patch(client.get('user')._id, {onDuty})
    .then(newMe => {
      onDuty ? toastr.success("You are now in office hours") :
        toastr.success("You have left office hours");

      this.setState({onDuty});
    }).catch(err => {
      toastr.error("Cannot change on duty status");
    })
  }

  getCurrentStudent = () => {
    const client = this.props.client;
    client.service('/tokens').find(
      {
        query: {
          $limit: 1,
          fulfilled: true,
          isBeingHelped: true,
          fulfilledBy: client.get('user')._id,
          $sort: {
            createdAt: 1
          },
          cancelledByStudent: false
        }
      }
    ).then(tickets => {
      // Have a current student
      var currentTicket = null;
      if (tickets.total > 0) {
        currentTicket = tickets.data[0];
      }

      this.setState({currentTicket});
    });
  }

  dequeueStudent = () => {
    const client = this.props.client;
    client.service('/dequeue-student').create({}).then(result => {
      this.getCurrentStudent();
    })
    .catch(err => {
      console.error(err);
    });
  }

  setPasscode = () => {
    const client = this.props.client;

    client.service('/passcode').get({}).then(res => {
      this.setState({passcode: res.passcode});
    });
  }


  markNoshow = () => {
    const client = this.props.client;
    if ((!!this.state.currentTicket) && window.confirm("Warning: Marking this student as a no show. Are you sure?")) {
      client.service('/tokens').patch(this.state.currentTicket._id, {
        isBeingHelped: false,
        isClosed: true,
        noShow: true,
        closedAt: Date.now(),
        // TODO: shouldIgnoreInTokenCount: false/true
      }).then(updatedTicket => {
        toastr.success("Student marked as a no-show and ticket closed");
        this.getCurrentStudent();
      }).catch(err => {
        toastr.error("Could not mark student as a no-show");
        console.error(err);
      });
    }
  }

  closeTicket = (comment) => {
    const client = this.props.client;
    if (!!this.state.currentTicket && window.confirm("Are you sure you want to permanently close this ticket?")) {
      $("#current-student-area").hide();
      client.service('comment').create(comment)
      .then(commentObj => {
        //TODO put this in hook asap
        client.service('/users').get(client.get('user')._id).then(res => {
          var t = 1;

          if (res.totalTickets !== undefined) {
            t = res.totalTickets + 1;
          }

          client.service('/users').patch(client.get('user')._id, {
            totalTickets: t,
          }).then(updatedStudent => {
            console.log(updatedStudent);
          });
        });
        return client.service('tokens').patch(this.state.currentTicket._id, {
          isBeingHelped: false,
          isClosed: true,
          // TODO: move closedAt and other dates to service hooks
          closedAt: Date.now(),
          comment: commentObj._id,
        })
      }).then(updatedTicket => {
        toastr.success("Ticket closed and comment successfully saved");
        this.getCurrentStudent();
      }).catch(err => {
        toastr.error("Could not close ticket");
        console.error(err);
      });
    }
  }

  render() {
    return <div className="row" style={{paddingTop:"15px"}}>
      <div className="col-md-3">
        <AvailableTas client={this.props.client} />
        <hr/>
        {
          this.state.onDuty ?
          <div className="panel panel-default">
            <div className="panel-heading">You are hosting office hours</div>
            <div className="panel-body">
              <h4>Hourly passcode:</h4>
              <h2 className="passcode">
                <span className="label label-success">{this.state.passcode}</span>
              </h2>
              <hr/>
              <button onClick={this.toggleOH} className="btn btn-default">Leave office hours</button>
              <div className="alert alert-success alert-dismissable" role="alert" style={{marginTop:"15px"}}>
                <button type="button" className="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                Do not forget to press the leave button before you depart.
              </div>
              <hr/>
              <div id="end-oh-area">
                <h4>End office hours:</h4>
                <button onClick={this.cancelAllTix} className="btn btn-warning" style={{marginTop:"10px"}}>Cancel all tickets</button>
              </div>
            </div>
          </div>
          : <div className="panel panel-default">
            <div className="panel-heading">You are not in office hours</div>
            <div className="panel-body">
              <button onClick={this.toggleOH} className="btn btn-default">Join office hours</button>
            </div>
          </div>
        }
        <hr/>

      </div>
        <div className="col-md-9">
          <p className="lead">Students in queue: <strong id="students-in-queue">{this.state.studentsInQueue}</strong></p>
          <hr />
          {
            this.state.onDuty ? <div>
              <Comments client={this.props.client} ticket={this.state.currentTicket}
              closeTicket={this.closeTicket} markNoshow={this.markNoshow} />

              <div id="student-queue-area" className="panel panel-default">
                <div className="panel-heading">Student queue</div>
                <div className="panel-body">
                  {
                    this.state.studentsInQueue > 0 ?
                    <button onClick={this.dequeueStudent} className="btn btn-success" style={{marginBottom: "15px"}}>Dequeue Student</button>
                    : <div></div>
                  }
                  <QueuedStudentsTable client={this.props.client} />
                </div>
              </div>
            </div>
            : <div></div>
          }
        </div>
    </div>
  }
}

export default Ta;
