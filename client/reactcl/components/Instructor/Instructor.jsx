import React from 'react';
import AvailableTas from '../AvailableTas';
import QueuedStudentsTable from '../QueuedStudentsTable';

import UserManage from './UserManage.jsx';
import UserRoster from './UserRoster.jsx';
import StudentStats from './StudentStats.jsx';
import Utils from '../../Utils';

class Instructor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      numTas: 0,
      studentQueue: [],
      userRoster: []
    };

    const user = props.client.get('user');
    const socket = props.client.get('socket');
    socket.on('users created', this.loadUserRoster);
    socket.on('users patched', this.loadUserRoster);
    this.loadUserRoster();

    // Don't toast because QueuedStudentsTable toasts for us
  }

  componentWillUnmount() {
    const socket = this.props.client.get('socket');
    socket.removeListener('users created', this.loadUserRoster);
    socket.removeListener('users patched', this.loadUserRoster);
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

  loadUserRoster = () => {
    this.props.client.service('/users').find(
      {query: {$limit: 5000, $sort: {createdAt: -1}}}
    ).then(results => {
      this.setState({userRoster:results.data})
    })
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
        <UserManage client={this.props.client} loadUserRoster={this.loadUserRoster} />
        <hr />
        <UserRoster client={this.props.client} userRoster={this.state.userRoster}
          loadUserRoster={this.loadUserRoster} />
      </div>
    </div>
  }
}

export default Instructor;
