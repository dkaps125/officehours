import React from 'react';
import InfiniteScroll from 'react-infinite-scroller';
import TicketDescModal from './TicketDescModal.jsx';

class TicketHistory extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tickets: [],
      itemsPerPage: 20,
      pagesLoaded: [],
      hasMoreTickets: true,
      modalVisible: false
    }

  }

  componentDidMount() {
    this.updateTicketList(0);
  }

  componentWillUnmount() {
  }

  componentDidUpdate(oldProps, oldState) {
    if (!oldProps.client && !!this.props.client) {

    }
  }

  updateTicketList = (page) => {
    page = !page ? 0 : page;

    const client = this.props.client;
    var q = {};

/*
    if (tokenQuery.length === 0) {
      q = {
        query: {
          $limit: itemsPerPage,
          $skip: page * itemsPerPage,
          $sort: {
            createdAt: -1
          }
        }
      };
    } else {
      q = {
        query: {
          $limit: itemsPerPage,
          $skip: page * itemsPerPage,
          $sort: {
            createdAt: -1
          },
          $or: tokenQuery
        }
      }
    }
    */
    q = {
      query: {
        $limit: this.state.itemsPerPage,
        $skip: page * this.state.itemsPerPage,
        $sort: {
          createdAt: -1
        }
      }
    };

    if (!!this.props.user) {
      q.query.user = this.props.user;
    }

    if (!!this.props.fulfilledBy) {
      q.query.fulfilledBy = this.props.fulfilledBy;
    }

    client.service('/tokens').find(q).then(tickets => {
      if (tickets.data.length < this.state.itemsPerPage) {
        this.setState({hasMoreTickets : false});
      }

      this.setState({tickets: this.state.tickets.concat(tickets.data)});
    });
  }

  showTicket(selectedTicket) {
    this.setState({selectedTicket});
    this.handleShowModal();
  }

  handleHideModal = () => {
    this.setState({modalVisible: false});
  }

  handleShowModal = () => {
    this.setState({modalVisible: true});
  }

  render() {
    return <div>
      <h3>Ticket history ({this.state.tickets.length})</h3>
      <InfiniteScroll
            pageStart={0}
            loadMore={this.updateTicketList}
            hasMore={this.state.hasMoreTickets}
            loader={<div className="loader">Loading tickets...</div>}
      >
      <table id="ticket-list" className="table" key={0}>
        <tbody>
          <tr key={0} className="active">
            <th>#</th>
            <th>Status</th>
            <th>Student</th>
            <th>Date</th>
            <th>TA</th>
            <th>Description</th>
          </tr>
          {
            this.state.studentsInQueue == 0 ?
              <tr key={"nothing"}><td><p style={{color: "gray"}}>No tickets</p></td></tr>
              :
            this.state.tickets.map((ticket, row) => {
              if (ticket.isClosed) {
                if (ticket.noShow) {
                  ticket.curStatus = "No-Show";
                } else if (ticket.cancelledByTA) {
                  ticket.curStatus = "Canceled (TA)";
                } else {
                  ticket.curStatus = "Closed";
                }
              } else {
                if (!ticket.fulfilled) {
                  ticket.curStatus = "Queued";
                } else if (!ticket.cancelledByStudent) {
                  ticket.curStatus = "In Progress";
                } else {
                  ticket.curStatus = "Canceled";
                }
              }

              return <tr id={"ticket-"+row} key={ticket._id} style={{"cursor": "pointer"}}
                onClick={() => {this.showTicket(ticket)}}>
                <td >{row+1}</td>
                <td >{ticket.curStatus}</td>
                <td >{ticket.user.name || ticket.user.directoryID}</td>
                <td >{(new Date(ticket.createdAt)).toLocaleString()}</td>
                <td >{!!ticket.fulfilledByName ? ticket.fulfilledByName : ""}</td>
                <td  className="col-xs-4">{ticket.desc || "No description"}</td>
              </tr>
            })
          }
        </tbody>
      </table>
      </InfiniteScroll>
      <TicketDescModal ticket={this.state.selectedTicket} visible={this.state.modalVisible}
        handleHideModal={this.handleHideModal}/>
    </div>
  }
}

export default TicketHistory;
