import React from 'react';

class PreviousComments extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      prevTickets: []
    };
  }

  componentDidMount() {
    this.props.client.service('/tokens').find({
      query: {
        $limit: 10,
        fulfilled: true,
        isBeingHelped: false,
        cancelledByStudent: false,
        user: this.props.ticket.user._id,
        $sort: {
          createdAt: -1
        }
      }
    }).then(tokens => {
      console.log(tokens.data);
      var prevTickets = tokens.data;
      prevTickets.map((ticket, i) => {
        prevTickets[i].comment = this.generateComment(ticket.comment);
      })
      this.setState({prevTickets});

    }).catch(console.error);


  }

  // dirty
  enablePopover = (e) => {
    $("[data-toggle=popover]").popover({ trigger: "hover" });
  }

  generateComment = comment => {
    var result = ""
    if (!comment) {
      return "";
    }
    if (!!comment.text) {
      result += comment.text + " ";
    }

    if (comment.knowledgeable !== "Not sure" && comment.toldTooMuch !== "Not sure") {
      result += "[From questionnaire]: "
    }
    if (comment.knowledgeable == "Yes") {
      result += "Student seemed knowledgeable";
      if (comment.toldTooMuch !== "Not sure") {
        result += " -- "
      }
    } else if (comment.knowledgeable == "No") {
      result += "Student did not seem knowledgeable";
      if (comment.toldTooMuch !== "Not sure") {
        result += " -- "
      }
    }

    if (comment.toldTooMuch == "Yes") {
      result += "Student may have been able to solve problem with less TA help";
    } else if (comment.toldTooMuch == "No") {
      result += "Student probably needed TA help to solve problem";
    }

    return result;

  }

  render() {
    const curTicket = this.props.ticket;
    return <div>
      <table className="table table-striped">
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
          {
            this.state.prevTickets.length == 0 ?
              <tr><td><p style={{color: "gray"}}>No tickets for {curTicket.userName}</p></td></tr>
            : this.state.prevTickets.map((ticket, row) => {
              return <tr key={row}>
                <td>{row}</td>
                <td><small>{new Date(ticket.closedAt).toLocaleString()}</small></td>
                <td><small>{ticket.fulfilledByName || 'N/A'}</small></td>
                <td>
                  {
                    ticket.desc && ticket.desc.length > 60 ?
                      <small title={'Full description for #'+(row+1)}
                        data-placement="bottom" data-toggle="popover"
                        data-html="true"
                        data-content={ticket.desc} onMouseEnter={this.enablePopover}>{ticket.desc.trunc(60,true)}
                        </small>
                      :
                      <small>{ticket.desc || "No desc"}</small>
                  }
                </td>
                <td>
                  {
                    ticket.comment && ticket.comment.length > 60 ?
                      <small title={'All feedback for #'+(row+1)}
                        data-placement="bottom" data-toggle="popover"
                        data-html="true"
                        data-content={ticket.comment} onMouseEnter={this.enablePopover}>{ticket.comment.trunc(60,true)}
                        </small>
                      :
                      <small>{ticket.comment || "No comments"}</small>
                  }
                </td>
              </tr>
            })
          }
        </tbody>
      </table>

    </div>
  }
}

export default PreviousComments
