import React from 'react';

class StudentStats extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };

    const user = props.client.get('user');
    const socket = props.client.get('socket');

  }

  componentDidMount() {
    const client = this.props.client;
    const socket = client.get('socket');

  }

  componentDidUpdate(prevProps, prevState) {

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

  render() {
    return (
      <div>
        <h3>Student statistics</h3>
          <div id="student-stats-well" className="well stats">
            <div className="statsBlock">
              <div className="statsPanel">
                <div id="stats-tix-total" className=""> </div>
              </div>
              <div className="statsFooter">
                <p className="statsText lead">Tickets (total)</p>
              </div>
            </div>
            <div className="statsBlock">
              <div className="statsPanel">
                <div id="stats-tix-week" className=""> </div>
              </div>
              <div className="statsFooter">
                <p className="statsText lead">Tickets (1 week)</p>
              </div>
            </div>
            <div className="statsBlock">
              <div className="statsPanel">
                <div id="stats-tix-today" className=""> </div>
              </div>
              <div className="statsFooter">
                <p className="statsText lead">Tickets (today)</p>
              </div>
            </div>
            <div className="statsBlock">
              <div className="statsPanel">
                <div id="stats-wait-avg" className=""> </div>
              </div>
              <div className="statsFooter">
                <p className="statsText lead">Avg Wait (mins)</p>
              </div>
            </div>
          </div>
          <table id="top-student-table" className="table">
            <thead>
              <tr className="active">
                <th>Name</th>
                <th>Total Tickets</th>
                <th>Avg tickets/week</th>
                <th>Last ticket date</th>
              </tr>
            </thead>
            <tbody>
              <tr>
              </tr>
            </tbody>
          </table>
      </div>
    )

  }
}

export default StudentStats;
