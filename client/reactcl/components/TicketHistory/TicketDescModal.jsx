import React from 'react';
import ReactDOM from 'react-dom';
import Utils from '../../Utils';

class TicketDescModal extends React.Component {
  constructor(props) {
    super(props);

  }

  componentDidMount() {
    $(ReactDOM.findDOMNode(this)).on('hidden.bs.modal', this.props.handleHideModal);
  }

  componentWillUnmount() {
    $(ReactDOM.findDOMNode(this)).modal('hide');
  }

  // TODO: on recv new props: $(ReactDOM.findDOMNode(this)).modal('show');

  componentDidUpdate(oldProps, oldState) {
    if (!oldProps.visible && this.props.visible) {
      console.log("SHOW");
      $(ReactDOM.findDOMNode(this)).modal('show');
    } else if (oldProps.visible && !this.props.visible) {
      //$(ReactDOM.findDOMNode(this)).modal('hide');
    }
  }

  render() {
    const ticket = this.props.ticket;

    if (!ticket) {
      return <div></div>
    }

    // Greg: This is abysmal both in design and the amount of nested div's
    // TODO: fix it
    return <div className="modal fade" id="ticket-modal" tabIndex="-1" role="dialog" aria-labelledby="ticket-modal-label">
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
            <h4 className="modal-title">
              {ticket.user.name || ticket.user.directoryID} on {(new Date(ticket.createdAt)).toLocaleString()}
            </h4>
          </div>
          <div className="modal-body">
            <h4>Ticket status: <span style={{color:"gray"}}>{ticket.curStatus}</span></h4>
            <p> Description: </p>
            <div className="well">{ticket.desc || "No description"}</div>
            {
              (ticket.fulfilled && !ticket.cancelledByStudent && !ticket.noShow) ?
                <div>
                  <hr />
                  <h5 className="modal-block">Dequeued by {Utils.genUserElt(ticket.fulfilledBy, ticket.fulfilledByName)} on&nbsp;
                    {(new Date(ticket.dequeuedAt)).toLocaleString()}
                  </h5>
                  {ticket.isClosed && (
                    <div>
                      <h5 className="modal-block">Closed at: {(new Date(ticket.closedAt)).toLocaleString()}</h5>
                      {
                        !!ticket.comment ?
                          <div>
                            <br />
                            <p>TA Notes:</p>
                              <h5 className="modal-block">Student was knowledgeable: { ticket.comment.knowledgeable }</h5>
                              <h5 className="modal-block">Student could have solved problem with less help: { ticket.comment.toldTooMuch }</h5>
                            <div className="well">
                              {(!!ticket.comment.text ? ticket.comment.text : "No notes")}
                            </div>
                          </div>
                         :
                        <div>
                            <p>TA Notes:</p>
                          <div className="well">
                            <h5>Comments not available</h5>
                          </div>
                        </div>
                      }
                    </div>
                  )}
                </div>
                :
                  !!ticket.cancelledByStudent ?
                    <div>
                      <hr/>
                      <h4> This ticket was canceled by the student</h4>
                    </div>
                    :
                  <div>
                    <h4>Student was not present</h4>
                    <hr />
                    <h5 className="modal-block">Responding TA: {ticket.fulfilledByName}</h5>
                    <br />
                  </div>
            }
          {Utils.genUserElt(ticket.user, 'View all tickets for '+(ticket.user.name || ticket.user.directoryID))}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    </div>
    /*
    <footer id="footer" className="ticket-desc-modal footer">
      <div className="container">
      </div>
    </footer>
    */
  }
}

export default TicketDescModal;
