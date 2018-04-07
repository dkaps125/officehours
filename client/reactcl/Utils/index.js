import React from 'react';

class Utils {
  static genUserElt(user, text) {
    // TODO: get Link from rrouter
    return <a href={'/user?id='+(user._id || user)}>{text}</a>;
  }

  static millisToTime(t) {
    t = t / 60000;
    const ret = precisionRoundDecimals(t, 1);
    return ret > 999 ? ">999" : ret;
  }
}

export default Utils;
