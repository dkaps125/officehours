import React from 'react';
import Utils from '../../Utils';

class CreateCourseWizard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      /*title: '',
      courseid: '',
      //ohURL: '',
      numTokens: 2,
      requiresPasscode: true*/
    };

    const user = props.client.get('user');
    const socket = props.client.get('socket');
  }

  componentWillUnmount() {
    const socket = this.props.client.get('socket');
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

  handleInputChange = (event) => {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
  }

  createCourse = event => {
    event.preventDefault();

    const client = this.props.client;

    client.service('/course').create(this.state)
    .then(course => {
      toastr.success("Course successfully created");
      // TODO: redirect to course page
    });

    this.setState({});

  }

  render() {
    return <div className="row" style={{paddingTop:"15px"}}>
      <div className="col-md-9">
        <h3>Create a course</h3>
        <form onSubmit={this.createCourse}>
          <div className="form-group">
            <label htmlFor="courseName">Course id</label>
            <input type="text" className="form-control" id="courseid" name="courseid"
              placeholder="CMSC330" onChange={this.handleInputChange} required/>
          </div>
          <div className="form-group">
            <label htmlFor="courseName">Course title</label>
            <input type="text" className="form-control" id="courseName" name="courseName"
              placeholder="Organization of Pogramming Languages"
              onChange={this.handleInputChange} />
          </div>
          <div className="form-group">
            <label htmlFor="courseURL">Schedule URL</label>
            <input type="url" className="form-control" id="ohURL" name="ohURL"
              placeholder="http://www.cs.umd.edu/class/spring2018/cmsc330/#officehours"
              onChange={this.handleInputChange}/>
          </div>
          <div className="form-group">
            <label htmlFor="numTokens">Tokens per day</label>
            <select className="form-control" id="numTokens" name="numTokens"
              onChange={this.handleInputChange} defaultValue={5}>
              <option>1</option>
              <option>2</option>
              <option>3</option>
              <option>4</option>
              <option>5</option>
              <option>6</option>
              <option>7</option>
              <option>8</option>
              <option>9</option>
              <option>10</option>
              <option>15</option>
              <option>20</option>
            </select>
          </div>
          <div className="checkbox">
            <label>
              <input type="checkbox" id="requirePasscode" name="requiresPasscode"
                onChange={this.handleInputChange} checked/> Require passcode
            </label>
          </div>

          <button type="submit" className="btn btn-success">Create course</button>

        </form>
      </div>
    </div>
  }
}

export default CreateCourseWizard;
