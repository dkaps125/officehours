import React from 'react';

class AvailableTas extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      numTas: 0,
      availabletas: [],
    }

    const socket = props.client.get('socket');
    socket.on('availabletas updated', this.getAvailableTAs);
    this.getAvailableTAs();
  }

  getAvailableTAs = () => {
    const client = this.props.client;
    client.service('/availabletas').find().then(tas => {
      this.setState({numTas: tas.total, availabletas: tas.data})
    });
  }

  render() {
    return <div>
      <p className="lead">Available TAs:
        <strong> {this.state.numTas}</strong>
      </p>
      <hr/>
      <div className="panel panel-primary">
        <div className="panel-heading">TAs hosting office hours</div>
        <table className="table">
          <tbody>
            {
              this.state.numTas == 0 ?
                <tr><td>
                  <small className="text-muted">No TAs are currently hosting office hours</small>
                </td></tr>
              : this.state.availabletas.map((ta, row) => {
                return <tr key={row}>
                  <td>
                    {ta.name || ta.directoryID}
                  </td>
                </tr>
              })
            }
          </tbody>
        </table>
      </div>
    </div>
  }
}

export default AvailableTas;
