import React from 'react';
import AvailableTas from '../AvailableTas';
import QueuedStudentsTable from '../QueuedStudentsTable';
import Utils from '../../Utils';

class Instructor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      numTas: 0,
      studentsInQueue: 0,
      studentQueue: [],
    };

    const user = props.client.get('user');
    const socket = props.client.get('socket');

    // Don't toast because QueuedStudentsTable toasts for us
    socket.on('tokens created', this.updateQueueCount);
    socket.on('tokens patched', this.updateQueueCount);

    if (!! user) {
      this.state.onDuty = user.onDuty;
    }
    this.updateQueueCount();
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
    return <div className="row" style={{paddingTop:"15px"}}>
      <div className="col-md-3">
        <h3>Dashboard</h3>
        <AvailableTas client={this.props.client} hideCount={true} />
      </div>
      <div className="col-md-9">
        <h3>Live student queue</h3>
        <QueuedStudentsTable client={this.props.client} />
        <hr />
        <h3>Student statistics</h3>
        <hr />

      </div>
    </div>
  }
}

export default Instructor;
