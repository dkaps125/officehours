// Course config & globals
const cfg = {
  navbarTitle: 'CMSC330 Office Hours',
  ohSchedURL: 'http://cs.umd.edu/class/spring2018/cmsc330/#officehours',
  ohSchedTitle: 'OH Schedule',
  statsAvailable: false
}

$(function() {
  // Load
  var navbarTitle = document.getElementsByClassName('app-title')[0];
  var ohSchedLink = document.getElementsByClassName('oh-sched-link')[0];
  if (!!navbarTitle) {
    navbarTitle.innerHTML = cfg.navbarTitle;
  }
  if (!!ohSchedLink) {
    ohSchedLink.href = cfg.ohSchedURL;
    ohSchedLink.innerHTML = cfg.ohSchedTitle;
  }
});
