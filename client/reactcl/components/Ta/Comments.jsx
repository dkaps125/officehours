import React from 'react';
import PreviousComments from './PreviousComments.jsx';

class Comments extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      knowledgeable: "Not sure",
      toldTooMuch: "Not sure",
      text: ""
    };
  }

  componentDidUpdate(oldProps, oldState) {
    if (!oldProps.ticket && !! this.props.ticket) {
      this.setState({
        student: this.props.ticket.user._id,
        ticket: this.props.ticket._id
      })
    }
  }

  handleInputChange = (event) => {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
  }

  render() {
    // https://stackoverflow.com/questions/1199352/smart-way-to-shorten-long-strings-with-javascript
    String.prototype.trunc = function(n, useWordBoundary) {
      if (this.length <= n) {
        return this;
      }
      var subString = this.substr(0, n-1);
      return (useWordBoundary ? subString.substr(0, subString.lastIndexOf(' '))
      : subString) + "...";
    }
    
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
                <input type="radio" value="Yes" name="knowledgeable"
                  onChange={this.handleInputChange}
                  checked={this.state.knowledgeable === "Yes"}/> Yes
              </label>
              <label className="radio-inline">
                <input type="radio" value="No" name="knowledgeable"
                  onChange={this.handleInputChange}
                  checked={this.state.knowledgeable === "No"} /> No
              </label>
              <label className="radio-inline">
                <input type="radio" value="Not sure" name="knowledgeable"
                  onChange={this.handleInputChange}
                  checked={this.state.knowledgeable === "Not sure"} /> Not sure
              </label>
              </div>
            </div>
            <div className="form-group">
              <label>Do you think the student could have still solved the problem with less help?</label>
              <div className="radio">
                <label className="radio-inline">
                  <input type="radio" value="Yes" name="toldTooMuch"
                    onChange={this.handleInputChange}
                    checked={this.state.toldTooMuch === "Yes"} /> Yes
                </label>
                <label className="radio-inline">
                  <input type="radio" value="No" name="toldTooMuch"
                    onChange={this.handleInputChange}
                    checked={this.state.toldTooMuch === "No"} /> No
                </label>
                <label className="radio-inline">
                  <input type="radio" value="Not sure" name="toldTooMuch"
                    onChange={this.handleInputChange}
                    checked={this.state.toldTooMuch === "Not sure"} /> Not sure
                </label>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="student-notes-box">Comments</label>
                <textarea className="form-control" rows="4" onChange={this.handleInputChange} name="text" placeholder="Briefly, what did you assist the student with."></textarea>
              </div>
            </form>
            <button id="close-ticket-btn" type="submit" onClick={() => {this.props.closeTicket(this.state)}} className="btn btn-default">Close ticket</button>
            <button id="noshow-btn" type="submit" onClick={this.props.markNoshow} className="btn" style={{display:"inline", marginLeft:"10px"}}>No show</button>
            <hr />
            <h4>{this.props.ticket.user.name + "'s previous comments"}</h4>

            <PreviousComments client={this.props.client} ticket={this.props.ticket} />
          </div>
        </div>
        : <div></div>
    }
  }

  export default Comments;
