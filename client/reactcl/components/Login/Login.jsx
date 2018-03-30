import React from 'react';
import { Redirect } from 'react-router-dom';

class Login extends React.Component {

  constructor(props) {
    super(props);
    this.state = {};
    if (!!props.client) {
      props.client.on('authWithUser', (user) => {
        this.setState({user});
      });

    }
  }

  componentDidMount() {
    document.body.classList.add('login-body');
  }

  componentWillUnmount() {
    document.body.classList.remove('login-body');
  }

  render() {
    console.log(this.state);
    if (!this.state.user) {
      return ( <main className="container login-container text-center">
        <div className="login-box">
          <div className="login-btn-box">
            <p className="lead">Log in with your university credentials</p>
          </div>
          <div className="login-btn-box login-btn">
            <a href="/cas_login" className="btn btn-info btn-lg" role="button">CAS Login</a>
          </div>
        </div>
      </main>
    )
    } else if (this.state.user.role === "Instructor") {
      return <Redirect to={{pathname:'/instructor', state: {from: this.props.location}}} />
    } else if (this.state.user.role === "TA") {
      return <Redirect to={{pathname:'/ta', state: {from: this.props.location}}} />
    } else if (this.state.user.role === "Student") {
      return <Redirect to={{pathname:'/student', state: {from: this.props.location}}} />
    }
  }
}

export default Login;
