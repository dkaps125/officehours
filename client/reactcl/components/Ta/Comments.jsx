import React from 'react';

class Comments extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  handleInputChange = (event) => {

  }

  render() {
    return !! this.props.ticket ?
    <div className="panel panel-default">
      <div className="panel-heading">Current Student</div>
      <div className="panel-body">
        <h4>Assisting: {this.props.ticket.user.name}</h4>
        <p style={{color:"gray"}}>Ticket created
          {' ' + new Date(this.props.ticket.createdAt).toLocaleString()}
        </p>
        <h3 id="current-student-time-warn" style={{paddingBottom:"15px"}}>
          <span className="label label-warning">
          Warning: You have spent over 10 minutes assisting this student
          </span>
        </h3>
        <label>Student's issue:</label>
        <div className="well">
          <p>{this.props.ticket.desc || "No description provided"}</p>
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
}

export default Comments;
