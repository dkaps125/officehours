import React from 'react';
import Utils from '../../Utils';

class UserRoster extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};

    const user = props.client.get('user');
    const socket = props.client.get('socket');


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

  deleteUser = (user) => {
    if (window.confirm("Are you sure you want to permanently delete this user?")) {
      this.props.client.service('/users').remove(user).then( res => {
        toastr.success("User successfully removed");
        this.props.loadUserRoster();
      }).catch(function(err) {
        toastr.error("Error removing user");
        console.error(err);
      })
    }
  }

  render() {
    return <div>
      <h3>All users</h3>
      <form className="form-inline">
        <input type="text" className="form-control" onKeyUp={this.search}
          placeholder="Search..." />
      </form>
      <table className="table table-striped" data-sortorder="1">
        <thead>
          <tr className="active">
            <th onClick={() => {this.sortTable(0)}}>#</th>
            <th onClick={() => {this.sortTable(1)}}>Directory ID</th>
            <th onClick={() => {this.sortTable(2)}}>Name</th>
            <th onClick={() => {this.sortTable(3)}}>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {
            !!this.props.userRoster && this.props.userRoster.map((user, row) => {
              const userIsMe = this.props.client.get('user')._id === user._id;
              return <tr key={row}>
                <td>{row+1}</td>
                <td>{Utils.genUserElt(user, user.directoryID)}
                {userIsMe && <a style={{color: "gray"}}> (Me)</a>}</td>
                <td>{Utils.genUserElt(user, user.name || user.directoryID)}
                {userIsMe && <a style={{color: "gray"}}> (Me)</a>}</td>
                <td>{user.role}</td>
                <td>{
                  !userIsMe ?
                    <a onClick={() => {this.deleteUser(user._id)}}>Delete ✖</a>
                    : <a style={{color: "gray"}}>Delete ✖</a>
                }</td>
              </tr>
            })
          }
        </tbody>
      </table>

    </div>
  }
}

export default UserRoster;
