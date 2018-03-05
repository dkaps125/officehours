import React from 'react';

class Ta extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isInOH: true,
      numTas: 0,
      studentsInQueue: 0,
      studentQueue: []
    };
  }

  componentDidMount() {
    this.setState({numTas: 1});
  }

  cancelAllTix = () => {
    console.log("end oh");
  }

  toggleOH = () => {
    console.log("join oh");
    this.setState({isInOH: !this.state.isInOH});
  }

  updateStudentQueue = () => {
    client.service('/tokens').find({query:
      {
        $limit: 100,
        fulfilled: false,
      }
    }).then(tickets => {
      this.setState({studentQueue: tickets.data,
        studentsInQueue: tickets.data.length});
    });
  }

  render() {
    return <div className="row" style={{paddingTop:"15px"}}>
      <div className="col-md-3">
        <p className="lead">Available TAs: <strong>{this.state.numTas}</strong></p>
        <hr/>
        <div id="clock-in-area" className="panel panel-default">
          <div className="panel-heading">You are not in office hours</div>
          <div className="panel-body">
            <button id="clock-in-btn" onClick={this.toggleOH} className="btn btn-default">Join office hours</button>
          </div>
        </div>
        <div id="clock-out-area" className="panel panel-default" style={{display:"none"}}>
          <div className="panel-heading">You are hosting office hours</div>
          <div className="panel-body">
            <form id="clock-out-form">
              <button id="clock-out-btn" type="submit" className="btn btn-default">Leave office hours</button>
              <div className="alert alert-success alert-dismissable" role="alert" style={{marginTop:"15px"}}>
                <button type="button" className="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                Do not forget to press the leave button before you depart.</div>
            </form>
            <hr/>
            <h4>Hourly passcode:</h4>
            <h2 className="passcode"><span id="passcode" className="label label-success">n/a</span></h2>
            <div id="end-oh-area">
              <hr/>
              <h4>End office hours:</h4>
              <button id="end-oh-btn" onClick={this.cancelAllTix} type="submit" className="btn btn-warning" style={{marginTop:"10px"}}>Cancel all tickets</button>
            </div>
          </div>
        </div>
        <hr/>

        <div className="panel panel-primary">
          <div className="panel-heading">TAs hosting office hours</div>
          <table id="ta-table" className="table">
          </table>
        </div>
      </div>
      {
        this.state.isInOH ? <div className="col-md-9">
          <p className="lead">Students in queue: <strong id="students-in-queue">{this.state.studentsInQueue}</strong></p>
          <hr />
          {
            !!this.state.currentStudent ?
            <div id="current-student-area" className="panel panel-default">
              <div className="panel-heading">Current Student</div>
              <div className="panel-body">
                <h4 id="current-student-name"></h4>
                <p id="current-student-ticket-createtime" style={{color:"gray"}}></p>
                <h3 id="current-student-time-warn" style={{paddingBottom:"15px"}}>
                  <span className="label label-warning">
                  Warning: You have spent over 10 minutes assisting this student
                  </span>
                </h3>
                <label> Student's issue:</label>
                <div className="well">
                  <p id="current-student-issue-text">No description provided</p>
                </div>
                <form id="student-notes-form">
                  <div className="form-group">
                    <label>Did the student seem to know what they were doing?</label>
                    <div className="radio">
                      <label className="radio-inline">
                        <input type="radio" id="inlineCheckbox1" value="Yes" name="radio1" /> Yes
                      </label>
                      <label className="radio-inline">
                        <input type="radio" id="inlineCheckbox2" value="No" name="radio1" /> No
                      </label>
                      <label className="radio-inline">
                        <input type="radio" id="inlineCheckbox3" value="Not sure" name="radio1" defaultChecked /> Not sure
                      </label>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Do you think the student could have still solved the problem with less help?</label>
                    <div className="radio">
                      <label className="radio-inline">
                        <input type="radio" id="inlineCheckbox1" value="Yes" name="radio2" /> Yes
                      </label>
                      <label className="radio-inline">
                        <input type="radio" id="inlineCheckbox2" value="No" name="radio2" /> No
                      </label>
                      <label className="radio-inline">
                        <input type="radio" id="inlineCheckbox3" value="Not sure" name="radio2" defaultChecked /> Not sure
                      </label>
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="student-notes-box">Comments</label>
                    <textarea className="form-control" rows="4" id="student-notes-box" placeholder="Briefly, what did you assist the student with."></textarea>
                  </div>
                </form>
                <form id="close-ticket-form inline">
                  <button id="close-ticket-btn" type="submit" className="btn btn-default">Close ticket</button>
                </form>
                <form id="noshow-form" style={{display:"inline", marginLeft:"8px"}}>
                  <button id="noshow-btn" type="submit" className="btn ">No show</button>
                </form>
                <hr />
                <h4 id="current-student-name-2"></h4>
                <table className="table table-striped" id="prev-tickets-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Closed date</th>
                      <th>TA</th>
                      <th>Description</th>
                      <th>TA Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                  </tbody>
                </table>
              </div>
            </div>
            : <div></div>
          }

          <div id="student-queue-area" className="panel panel-default">
            <div className="panel-heading">Student queue</div>
            <div className="panel-body">
              <form id="student-dequeue-form">
                <button id="student-dequeue-btn" type="submit" className="btn btn-success">Dequeue Student</button>
              </form>
              <table id="student-table" className="table">
                <tbody>
                  <tr className="active">
                    <th>Num</th>
                    <th>Student</th>
                    <th>Description</th>
                    <th>Date submitted</th>
                  </tr>
                  {
                    this.state.studentQueue.map((ticket, row) =>
                        <tr key={row}>
                          <td>{row}</td>
                          <td>{ticket.user.name || ticket.user.directoryID}</td>
                          <td>{ticket.desc || "No description"}</td>
                          <td>{new Date(ticket.createdAt)}</td>
                        </tr>
                    )
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
        : <div></div>
      }
    </div>
  }
}

export default Ta;
