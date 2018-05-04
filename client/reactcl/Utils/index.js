import React from 'react';
import { Link } from 'react-router-dom';
class Utils {
  static genUserElt(user, text) {
    return <Link to={{
      pathname: '/user',
      search: '?id='+(user._id || user)
    }}>{text}</Link>;
  }

  static millisToTime(t) {
    t = t / 60000;
    const ret = precisionRoundDecimals(t, 1);
    return ret > 999 ? ">999" : ret;
  }

  static getUrlParameter(search, name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
  }
}

export default Utils;
