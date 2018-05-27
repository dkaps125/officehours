import React from 'react';
import Utils from '../../Utils';

class ManageCourses extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
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

  render() {
    return <div className="row" style={{paddingTop:"15px"}}>
      <div className="col-md-9">
        <h3>List of courses</h3>

      </div>
    </div>
  }
}

export default ManageCourses;
