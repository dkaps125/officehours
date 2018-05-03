import React from 'react';
import Utils from '../../Utils';

class UserEdit extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      role: props.user.role,
      name: props.user.name,
      directoryID: props.user.directoryID
    };

  }

  componentDidMount() {

  }

  componentDidUpdate(prevProps, prevState) {

  }

  toastAndUpdate = (msg, cb) => {
    toastr.success(msg);
    cb();
  }

  handleInputChange = (event) => {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
  }

  handleSubmit = (event) => {
    this.props.handleSubmit(this.props.user, this.state);
  }

  render() {
    return <div>
      <h3>Edit user</h3>
      <form className="form-inline">
        <div className="form-group">
          <label htmlFor="userName">&nbsp;Name</label>
          <input type="text" className="form-control" name="name"
            value={this.state.name}
            onChange={this.handleInputChange} />
        </div>
        <div className="form-group">
          <label htmlFor="directoryID">&nbsp;Directory ID</label>
          <input type="text" className="form-control" name="directoryID"
            value={this.state.directoryID}
            onChange={this.handleInputChange} />
        </div>
        <div className="form-group">
          <label htmlFor="role">&nbsp;Role</label>
          <select className="form-control" name="role"
            onChange={this.handleInputChange} value={this.state.role}>
            <option value="Student">Student</option>
            <option value="TA">TA</option>
            <option value="Instructor">Instructor</option>
          </select>
        </div>
        &nbsp;
        <button type="button" className="btn btn-default"
          onClick={this.handleSubmit}>Update user</button>
      </form>
    </div>
  }
}

export default UserEdit;
