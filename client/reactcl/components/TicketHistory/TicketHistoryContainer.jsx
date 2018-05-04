import React from 'react';
import TicketHistory from './TicketHistory.jsx';

class TicketHistory extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    }

  }

  componentDidMount() {
    const socket = this.props.client.get('socket');

    // Bind events
    socket.on('tokens created', this.ticketCreated);
    socket.on('tokens patched', this.ticketPatched);
  }

  componentWillUnmount() {
    const socket = this.props.client.get('socket');

    socket.removeListener('tokens created', this.ticketCreated);
    socket.removeListener('tokens patched', this.ticketPatched);
  }

  componentDidUpdate(oldProps, oldState) {
    if (!oldProps.client && !!this.props.client) {

    }
  }

  ticketCreated = () => {
    toastr.success('New ticket created');
  }

  ticketPatched = () => {
    toastr.success('Ticket status updated');
  }

  render() {
    return <TicketHistory client={this.props.client} searchBar={true} />
  }
}

export default TicketHistoryContainer;
