import React from 'react';
import Utils from '../../Utils';

class UserManage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      role: 'Student',
      name: '',
      directoryID: ''
    };

    const user = props.client.get('user');
    const socket = props.client.get('socket');

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

  deleteAllWithRole = role => {
    this.props.client.service('/users').remove(null, {
      query: {
        role
      }
    }).then(res => {
      this.props.loadUserRoster();
      toastr.success("Successfully deleted users");
    }).catch(err => {
      console.err(err);
    });
  }

  deleteAllStudents = (event) => {
    if (window.confirm("Are you sure you want to permanently delete ALL students?")) {
      this.deleteAllWithRole("Student");
    }
  }

  deleteAllTAs = (event) => {
    if (window.confirm("Are you sure you want to permanently delete ALL TA's?")) {
      this.deleteAllWithRole("TA");
    }
  }

  userCreate = (event) => {
    event.preventDefault();

    if (!this.state.name || !this.state.directoryID || !this.state.role) {
      toastr.warning("Missing field in user creation form");
      return;
    }
    const newUser = {
      name: this.state.name,
      directoryID: this.state.directoryID,
      role: this.state.role
    };


    this.props.client.service('/users').create(newUser).then(res => {
      toastr.success("User " + this.state.name + " successfully created");
      this.setState({name: '', directoryID: ''});
      this.props.loadUserRoster();
    }).catch(function(err) {
      toastr.error("Could not create user with this directory ID and name");
      console.error(err);
    });
  }

  render() {
    return <div>
      <hr id="manage-user" />
      <h3>Add user</h3>
      <form className="form-inline">
        <div className="form-group">
          <label htmlFor="userName">&nbsp;Name</label>
          <input type="text" className="form-control" name="name"
            placeholder="John Smith" value={this.state.name}
            onChange={this.handleInputChange} />
        </div>
        <div className="form-group">
          <label htmlFor="directoryID">&nbsp;Directory ID</label>
          <input type="text" className="form-control" name="directoryID"
            placeholder="example" value={this.state.directoryID}
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
          onClick={this.userCreate}>Create user</button>
      </form>
      <hr />

      <h3>Bulk user creation</h3>
      <a href="example.csv">Download example CSV file</a>

      <p>Upload a CSV, must be comma separated. Names cannot contain commas.
        <br />
        Only include columns:
        <strong>name,directoryID,role</strong>
        where role is either "Instructor", "Student", or "TA"
      </p>

      <br />
      <form action="" method="post" encType="multipart/form-data" id="js-upload-form" accept=".csv">
        <div className="form-inline">
          <div className="form-group">
            <input type="file" name="files[]" id="js-upload-files" />
          </div>
          <div className="form-group">
            <button type="submit" className="btn btn-sm btn-primary" id="js-upload-submit">Upload CSV</button>
          </div>
        </div>
      </form>
      <hr />
      <h3>Bulk user deletion</h3>
      <button onClick={this.deleteAllStudents} className="btn btn-warning">Delete all students</button>
      &nbsp;
      <button onClick={this.deleteAllTAs} className="btn btn-warning">Delete all TAs</button>
    </div>
  }
}

export default UserManage;
