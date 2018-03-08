import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import { BrowserRouter as Router, Switch, Route, Link, browserHistory } from 'react-router-dom';
import Ta from './components/Ta';
import Student from './components/Student';
import Login from './components/Login';

const render = (Comp) => {
  ReactDOM.render(
    <AppContainer>
    <Comp />
    </AppContainer>,
    document.getElementById('app'),
  );
}

class Application extends React.Component {

  constructor(props) {
    super(props);
    const socket = io({secure: true});
    const client = feathers()
    .configure(feathers.hooks())
    .configure(feathers.socketio(socket))
    .configure(feathers.authentication({
      cookie: 'feathers-jwt',
    }));
    const users = client.service('/users');

    client.set('socket', socket);

    // Try to authenticate with the JWT stored in localStorage
    client.authenticate()
    .then(response => {
      console.info("authenticated successfully");
      client.set('jwt', response.accessToken)
      return client.passport.verifyJWT(response.accessToken);
    })
    .then(payload => {
      console.info("verified JWT");
      return users.get(payload.userId);
    })
    .then(user => {
      client.set('user', user);
      client.emit('authWithUser', user);
    })
    .catch((err) => {console.log(err)});
    this.state = {client};
  }

  componentDidMount() {

  }

  render() {
    return <Router>
      <div>
        <Nav/>
        <div id="main" className="container login-container">
          <Route exact path="/" render={(routeProps) => (
              <Home {...routeProps} client={this.state.client} />
          )} />
        </div>
        </div>
    </Router>
  }
};

class Nav extends React.Component {
  constructor(props) {
    super(props);
    this.state = {

    };
  }

  componentDidMount() {

  }

  logout = () => {
    client.logout().then(() => {
      location.reload();
    });
  }

  render() {
    return <nav className="navbar">
      <div className="container-fluid">
        <div className="navbar-header">
          <button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1" aria-expanded="false">
            <span className="sr-only">Toggle navigation</span>
            <span className="icon-bar"></span>
            <span className="icon-bar"></span>
            <span className="icon-bar"></span>
          </button>
          <a className="navbar-brand app-title" href="#">Office Hours</a>
        </div>
        <div className="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
          <ul className="nav navbar-nav">
            <li className="active"><a href="#">TA Home <span className="sr-only">(current)</span></a></li>
            <li><a href="/tickets">Ticket history</a></li>
            <li><a className="oh-sched-link" href="#">OH Schedule</a></li>
          </ul>
          <ul className="nav navbar-nav navbar-right">
            <li><a href="#" onClick={this.logout}>Logout</a></li>
          </ul>
        </div>
      </div>
    </nav>
  }

}

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {

    };

    props.client.on("authWithUser", (user) => {
      console.log(user);
      this.setState({user});
    });
  }

  componentDidMount() {

  }

  render() {
    if (!this.state.user) {
      return <Login />;
    } else if (this.state.user.role === "TA") {
        return <Ta client={this.props.client} user={this.state.user} />
    } else if (this.state.user.role === "Instructor") {
        return <Ta client={this.props.client} />
    }
    return <Student client={this.props.client} user={this.state.user} />
  }
}

class Instructor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return <div className="row" style={{paddingTop:"15px"}}>
      <p> Instr View goes here </p>
    </div>
  }

}

render(Application);
