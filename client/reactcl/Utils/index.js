class Utils {
  genUserElt(user, text) {
    // TODO: get Link from rrouter
    return <a href={'/user?id='+(user._id || user)}>{text}</a>;
  }
}

export default Utils;
