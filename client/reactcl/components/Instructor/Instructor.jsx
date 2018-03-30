import React from 'react';
import AvailableTas from '../AvailableTas';
import QueuedStudentsTable from '../QueuedStudentsTable';

import StudentStats from './StudentStats.jsx';
import Utils from '../../Utils';

class Instructor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      numTas: 0,
      studentQueue: [],
    };

    const user = props.client.get('user');
    const socket = props.client.get('socket');

    // Don't toast because QueuedStudentsTable toasts for us
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

  }

  toastAndUpdate = (msg, cb) => {
    toastr.success(msg);
    cb();
  }

  render() {
    return <div className="row" style={{paddingTop:"15px"}}>
      <div className="col-md-3">
        <h3>Dashboard</h3>
        <AvailableTas client={this.props.client} hideCount={true} />
      </div>
      <div className="col-md-9">
        <h3>Live student queue</h3>
        <QueuedStudentsTable client={this.props.client} />
        <hr />
        <StudentStats client={this.props.client} />
        <hr />

      </div>
    </div>
  }
}

export default Instructor;
