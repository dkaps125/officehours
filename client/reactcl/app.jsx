import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import { BrowserRouter as Router, Switch, Route, Link, browserHistory, Redirect } from 'react-router-dom';
import Ta from './components/Ta';
import Student from './components/Student';
import Login from './components/Login';
import Instructor from './components/Instructor';
import TicketHistory from './components/TicketHistory';
import UserDetails from './components/UserDetails';
import ManageCourses from './components/ManageCourses'
import CreateCourseWizard from './components/CreateCourseWizard'

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
      client.set('socket', socket);
      client.emit('authWithUser', user);
      this.setState({user})
      client.on('reauthentication-error', () => {console.log("REAUTH ERROR!")});
    })
    .catch((err) => {console.log(err)});
    this.state = {client};
  }

  componentDidMount() {

  }
  //<Route exact path="/" render={(routeProps) => ()} component={Login}/>
  //<Route exact path="/" component={Login}/>

  /*
  else if (this.state.user.role === "Instructor") {
    return <Redirect to={{pathname:'/ta', state: {from: this.props.location}}} />
  } else if (this.state.user.role === "TA") {
    return <Redirect to={{pathname:'/ta', state: {from: this.props.location}}} />
  } else if (this.state.user.role === "Student") {
    return <Redirect to={{pathname:'/student', state: {from: this.props.location}}} />
  } else {
    return <Redirect to={{pathname:'/login', state: {from: this.props.location}}} />
  }
  */
          /*went in render below <Route exact path="/" user={this.state.user} render={(props) => {
              console.log(this.props.user);
            return !props.user ? (
              <Redirect to={{pathname: "/login", state: {user:props.user}}} />
            ) : (
              user.role === 'TA' ? (
                <Redirect to="/ta" />
              ) : (
                user.role === 'Instructor' ? (
                  <Redirect to="/ta" />
                ) : (
                  <Redirect to="/student" />
                )
              )
            )
          }} />*/

  render() {
    const user = this.state.user;
    return <Router>
      <div>
        <Nav client={this.state.client} location={this.props.location} />
        <div id="main" className="container login-container">
          <FeathersRoute exact path="/" client={this.state.client} component={Login} />
          <FeathersRoute path="/login" client={this.state.client} component={Login} />
          <FeathersRoute path="/instructor" client={this.state.client} forRoles={["Instructor"]} component={Instructor} />
          <FeathersRoute path="/ta" client={this.state.client} forRoles={["Instructor", "TA"]} component={Ta} />
          <FeathersRoute path="/student" client={this.state.client} forRoles={["Student"]} component={Student} />
          <FeathersRoute path="/tickets" client={this.state.client} forRoles={["Instructor", "TA"]} component={TicketHistory} />
          <FeathersRoute path="/user" client={this.state.client} forRoles={["Instructor", "TA"]} component={UserDetails} />
          <FeathersRoute exact path="/courses" client={this.state.client} forRoles={["Instructor"]} component={ManageCourses} />
          <FeathersRoute path="/courses/create" client={this.state.client} forRoles={["Instructor"]} component={CreateCourseWizard} />
        </div>
      </div>
    </Router>
  }
};

const FeathersRoute = ({ component: Component, client: client, ...rest }) => (
  <Route
    {...rest}
    render={props =>
      (<Component {...props} client={client} />)
    }
  />
)

const AuthenticatedRoute = ({ component: Component, client: client, ...rest }) => (
  <Route
    {...rest}
    render={props =>
      !! props.client.get('user') /* && props.forRoles.contains(props.user)*/ ? (
        <Component {...props} />
      ) : (
        <Redirect
          to={{
            pathname: "/",
            state: { from: props.location }
          }}
        />
      )
    }
  />
);

class Nav extends React.Component {
  constructor(props) {
    super(props);
    const possibleUser = props.client.get('user');
    this.state = {
      location: this.props.location,
      user: possibleUser,
      roles: []
    };

    if (!!possibleUser) {
      this.state.roles = [possibleUser.role];
    }

    props.client.on('authWithUser', (user) => {
      this.setState({user, roles: [user.role]});
    });
  }

  componentDidMount() {

  }

  logout = () => {
    this.props.client.logout().then(() => {
      location.reload();
    });
  }

  // TODO: <li className="active"> <span className="sr-only">(current)</span>
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
          <a className="navbar-brand dropdown-toggle" data-toggle="dropdown" href="#">
            CMSC131 Office Hours
            <span className="caret"></span></a>
              <ul className="dropdown-menu" style={{marginLeft: "25px"}}>
                <li><a>Recent courses:</a></li>
                <li role="separator" className="divider"></li>
                <li><a href="#">CMSC330</a></li>
                <li><a href="#">CMSC131</a></li>
                <li role="separator" className="divider"></li>
                <li><Link to="/courses">All courses</Link></li>
                <li><Link to="/courses/create">Manage CMSC131</Link></li>
                <li role="separator" className="divider"></li>
                <li><Link to="/courses/create">+ New Course</Link></li>
              </ul>
        </div>
        <div className="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
          <ul className="nav navbar-nav">
            {
              this.state.roles.includes('Instructor') &&
                <li><Link to="/instructor">Instructor home</Link></li>
            }
            {
              (this.state.roles.includes('Instructor') || this.state.roles.includes('TA')) &&
                <li><Link to="/ta">TA Home</Link></li>
            }
            {
              (this.state.roles.includes('Instructor') || this.state.roles.includes('TA')) &&
                <li><Link to="/tickets">Ticket history</Link></li>
            }
            {
              (this.state.roles.includes('Student')) &&
              <li><Link to="/student">Home</Link></li>
            }
            <li><a className="oh-sched-link" href="#">OH Schedule</a></li>
          </ul>
          <ul className="nav navbar-nav navbar-right">
            {
              this.state.user && <li><a href="#" onClick={this.logout}>Logout</a></li>
            }
          </ul>
        </div>
      </div>
    </nav>
  }

}

class LoginContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {

    };

    props.client.on('authWithUser', (user) => {
      console.log(user);
      this.setState({user});
    });
  }

  componentDidMount() {

  }

  render() {
    /*if (!this.state.user) {
      return <Login />;
    } else if (this.state.user.role === "TA") {
        //return <Ta client={this.props.client} user={this.state.user} />
    } else if (this.state.user.role === "Instructor") {
        //return <Ta client={this.props.client} />
    }
    //return <Student client={this.props.client} user={this.state.user} />
    */
    /*if (!this.state.user ) {
      return <Redirect to={{pathname:'/login', state: {from: this.props.location}}} />
    } */

    return props.children;
  }
}

render(Application);
