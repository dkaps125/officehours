import React from 'react';

class Login extends React.Component {
  componentDidMount() {
    document.body.classList.add('login-body');
  }

  componentWillUnmount() {
    document.body.classList.remove('login-body');
  }

  render() {
    return <main className="container login-container text-center">
      <div className="login-box">
        <div className="login-btn-box">
          <p className="lead">Log in with your university credentials</p>
        </div>
        <div className="login-btn-box login-btn">
          <a href="/cas_login" className="btn btn-info btn-lg" role="button">CAS Login</a>
        </div>
      </div>
    </main>
  }
}

export default Login;
