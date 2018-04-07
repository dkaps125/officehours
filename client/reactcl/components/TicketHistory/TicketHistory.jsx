import React from 'react';

class TicketHistory extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      studentQueue: []
    }

  }

  componentDidMount() {
    const socket = this.props.client.get('socket');

    // Bind events
    socket.on('tokens created', this.ticketCreated);
    socket.on('tokens patched', this.ticketPatched);

    this.updateStudentQueue();
  }

  componentWillUnmount() {
    const socket = this.props.client.get('socket');

    socket.removeListener('tokens created', this.ticketCreated);
    socket.removeListener('tokens patched', this.ticketPatched);
  }

  componentDidUpdate(oldProps, oldState) {
    if (!oldProps.client && !!this.props.client) {

    }
  }

  ticketCreated = () => {
    this.updateStudentQueue();
    toastr.success('New ticket created');
  }

  ticketPatched = () => {
    this.updateStudentQueue();
    toastr.success('Ticket status updated');
  }

  updateStudentQueue = () => {
    const client = this.props.client;
    client.service('/tokens').find({query:
      {
        $limit: 100,
        fulfilled: false,
      }
    }).then(tickets => {
      this.setState({studentQueue: tickets.data,
        studentsInQueue: tickets.total});
    });
  }

  render() {
    return <table className="table">
      <tbody>
        <tr className="active">
          <th>Num</th>
          <th>Student</th>
          <th>Description</th>
          <th>Date submitted</th>
        </tr>
        {
          this.state.studentsInQueue == 0 ?
            <tr><td><p style={{color: "gray"}}>No students in queue</p></td></tr>
          : this.state.studentQueue.map((ticket, row) => {
            return <tr key={row}>
              <td>{row+1}</td>
              <td>{ticket.user.name || ticket.user.directoryID}</td>
              <td>{ticket.desc || "No description"}</td>
              <td>{(new Date(ticket.createdAt)).toLocaleString()}</td>
            </tr>
          })
        }
      </tbody>
    </table>
  }
}

export default TicketHistory;
