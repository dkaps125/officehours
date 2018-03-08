import React from 'react';

class QueuedStudentsTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      studentsInQueue: 0,
      studentQueue: []
    }

    const socket = props.client.get('socket');

    // Bind events
    socket.on('tokens created', token => {
      this.updateStudentQueue();
      toastr.success('New ticket created');
    });
    socket.on('tokens patched', token => {
      this.updateStudentQueue();
      toastr.success('Ticket status updated');
    });

    this.updateStudentQueue();
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

export default QueuedStudentsTable;
