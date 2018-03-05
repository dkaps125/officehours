import React from 'react';

class Student extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      numTas: 0,
      studentsInQueue: 0,
      numTokens: 0,
      currentResponder: "",
      totalUnfulfilledTokens: 0,
    };
  }

  componentDidMount() {
    this.setState({numTas: 1});
  }

  submitTicket = () => {

  }

  render() {
    return <div className="row" style={{paddingTop:"15px"}}>
      <div className="col-md-3">
        <p className="lead">Available TAs:
          <strong id="num-tas"> {this.state.numTas}</strong>
        </p>
        <hr />
        <div id="ta-panel" className="panel panel-primary">
          <div className="panel-heading">TAs hosting office hours</div>
          <table id="ta-table" className="table">
          </table>
        </div>
      </div>
      <div className="col-md-8">
        <p className="lead">Students in queue:
          <strong id="students-in-queue"> {this.state.studentsInQueue}</strong>
        </p>
        <div className="panel panel-default">
          <div className="panel-heading">Request Office Hours</div>
          <div className="panel-body">
            {
              this.state.hasUnfulfilledTicket ?
              <div id="ticket-submit-area">
              <p id="num-tokens">You have <strong>{this.state.numTokens}</strong> tokens remaining.</p>
              <p><small>This will add you to the office hours queue and will cost one OH token.
                If you run out of tokens, you will not be able to receive office hours assistance
                until regeneration (every 24 hours).</small>
              </p>
              <hr/>
              <form id="ticket-submit-form">
                <textarea id="ticket-desc" className="form-control" rows="2" placeholder="Briefly describe your issue (max 2 sentences)"></textarea>
                <br/>
                <input type="text" id="ticket-code" className="form-control" rows="1" placeholder="Passcode" autoComplete="off"></input>
                <br/>
                <div className="alert alert-warning">
                  Make sure your code is checked into the submit server before your session starts.
                </div>
                <button id="ticket-button" onClick={this.submitTicket} className="btn btn-default">Request help</button>
              </form>
            </div>
            : (this.state.totalUnfulfilledTokens > 0 ?
              <div id="ticket-no-submit">
                <h4 id="ticket-queue-msg"></h4>
                <button id="cancel-req" type="button" className="btn btn-danger" style={{marginTop:"10px"}}>
                  Cancel request
                </button>
              </div>
              : <div id="current-ticket-area">
                <h4 id="ticket-responder-name">{this.state.currentResponder}</h4>
                <br/>
                <p>Ticket description: </p>
                <div className="well">
                  <p id="ticket-description"></p>
                </div>
              </div>
            )
          }
          </div>
        </div>
      </div>
    </div>
  }
}

export default Student;
