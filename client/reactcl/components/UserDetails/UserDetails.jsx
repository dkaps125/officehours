import React from 'react';
import Utils from '../../Utils';

class UserDetails extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      userId: Utils.getUrlParameter(this.props.location.search, 'id'),
    };
    const client = this.props.client;
    const socket = client.get('socket');

    client.service('/users').get(this.state.userId).then(user => {
      if (user.role !== 'Student' && (client.get('user').role === 'TA')) {
        /* no-op */
        return;
      }
      this.setState({user: user});
    })
  }

  componentDidMount() {
  }

  handleInputChange = event => {
    var curReq = {
      ...this.state.curReq,
      [event.target.name]: event.target.value
    };

    this.setState({curReq});
  }

  deleteUser = () => {
    console.log("TODO");
  }

  render() {
    if (!this.state.user) {
      return <div><h2>Cannot find user</h2></div>
    }

    const user = this.state.user;

    return <div className="row" style={{paddingTop:"15px"}}>
      <div className="instr-sidebar-container col-xl-3 col-lg-3 col-md-3  device-xl device-lg device-md visible-xl visible-lg visible-md">
        <div className="affix">
          <h3>{user.name}</h3>
          <hr />
            <p><strong>Directory ID:</strong> <span>{user.directoryID}</span></p>
            <p><strong>Role:</strong> <span>{user.role}</span></p>
            <br />
            <button onClick={this.deleteUser} className="instr-only btn btn-warning">Delete user</button>
          </div>
        </div>
        <div className="col-md-3 device-sm device-xs visible-sm visible-xs">
          <div className="sidebar-nav" id="userdetail-sidebar-sm">
            <h3>{user.name}</h3>
            <hr />
            <p><strong>Directory ID:</strong>{user.directoryID}</p>
            <p><strong>Role:</strong>{user.role}</p>
            <br />
            <button onClick={this.deleteUser} className="instr-only btn btn-warning">Delete user</button>
          </div>
        </div>
        ///
      </div>
    }
  }

  export default UserDetails;
