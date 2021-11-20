import { CPGrabber, CPGrabberOptions } from "./src/grabber.js";

// main method
const main = async () => {

  // set config
  const CP_GRABBER_OPTIONS: CPGrabberOptions = {
    room: '15min',
    splitByOwner: true,
    keywords: [
      'fullsizerender',
      'xham',
      'wife',
      'gf',
      'ex',
      'img_',
      '10 sec',
      '10sec',
      '5sec',
      '5 sec',
      '3sec',
      '3 sec',
      'quick',
      'no save',
      'risk',
      'only',
      '10s',
      '5s',
      '3s'
    ],
    saveAllMedia: true, // set true to disable keywords filter and save all media
  };

  // run chatpic grabber
  new CPGrabber(CP_GRABBER_OPTIONS);
}

// showtime!
main()
