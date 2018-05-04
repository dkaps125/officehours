import React from 'react';
import Utils from '../../Utils';
import TicketHistory from '../TicketHistory';
import UserEdit from './UserEdit.jsx';

class UserDetails extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      userId: Utils.getUrlParameter(this.props.location.search, 'id'),
    };
    const client = this.props.client;
    const socket = client.get('socket');
    this.loadUser();

  }

  loadUser = () => {
    const client = this.props.client;
    client.service('/users').get(this.state.userId).then(user => {
      if (user.role !== 'Student' && (client.get('user').role === 'TA')) {
        /* no-op */
        return;
      }
      this.setState({user: user});
    });
  }

  componentDidMount() {
  }

  toastAndUpdate = (msg, cb) => {
    toastr.success(msg);
    cb();
  }

  handleSubmit = (oldUser, newUser) => {
    const usersSvc = this.props.client.service('/users');

    usersSvc.patch(oldUser._id, newUser)
    .then(() => {
      this.toastAndUpdate("User successfully updated", this.loadUser);
    })
    .catch(() => {
      toastr.error("Could not update user");
    });

  }

  deleteUser = () => {
    if (window.confirm("Are you sure you want to permanently delete " +
      (this.state.user.name || this.state.user.directoryID))) {
      this.props.client.service('/users').remove(this.state.user._id).then(() => {
        toastr.success("User successfully deleted");
        this.setState({user: null});
      }).catch(err => {
        toastr.error("Could not delete user");
      });
    }
  }

  render() {
    if (!this.state.user) {
      return <div><h2>User not found</h2></div>
    }

    const user = this.state.user;
    const isThisMe = this.props.client.get('user')._id == this.state.user._id;

    return <div className="row" style={{paddingTop:"15px"}}>
      <div className="instr-sidebar-container col-xl-3 col-lg-3 col-md-3  device-xl device-lg device-md visible-xl visible-lg visible-md">
        <div className="affix">
          <h3>{user.name}</h3>
          <hr />
            <p><strong>Directory ID:</strong> <span>{user.directoryID}</span></p>
            <p><strong>Role:</strong> <span>{user.role}</span></p>
            <br />
              {!isThisMe &&
                <button onClick={this.deleteUser} className="instr-only btn btn-warning">Delete user</button>
              }
          </div>
        </div>
        <div className="col-md-3 device-sm device-xs visible-sm visible-xs">
          <div className="sidebar-nav" id="userdetail-sidebar-sm">
            <h3>{user.name}</h3>
            <hr />
            <p><strong>Directory ID:</strong>{user.directoryID}</p>
            <p><strong>Role:</strong>{user.role}</p>
            <br />
              {!isThisMe &&
                <button onClick={this.deleteUser} className="instr-only btn btn-warning">Delete user</button>
              }
          </div>
        </div>
        <div className="col-xl-9 col-lg-9 col-md-9">
          {this.props.client.get('user').role === "Instructor" &&
            <UserEdit user={user} handleSubmit={this.handleSubmit} />
          }
          <hr />
          <div id="STUDENT OR TA STATS"> </div>
          {
            user.role === "Student" ?
            <TicketHistory client={this.props.client} user={user} searchBar={false} />
            : <TicketHistory client={this.props.client} fulfilledBy={user} searchBar={false} />
          }
        </div>

      </div>
    }
  }

  export default UserDetails;
