const dayjs = require("dayjs");
const duration = require("dayjs/plugin/duration");
dayjs.extend(duration);

module.exports = class DataIntegrator {
  constructor() {}

  integrateSpotifyBluetooth(data) {
    /*
      - Bluetooth takes priority for track and progress
      - if Bluetooth and Spotify agree, we insert Spotify album art
      - if Bluetooth is active but disagrees with Spotify, pick bluetooth
      - if Bluetooth is inactive, rely on Spotify for everything
    */
    //console.log(data);
    if (data === undefined || !(data.spotify.active || data.bluetooth.active)) {
      return {
        active: false,
        image: "SPOTIFY",
        deviceName: null
      };
    }
    let position, duration, trackName, image, deviceName, active;

    active = data.spotify.active || data.bluetooth.active;
    position = data.spotify.position;
    duration = data.spotify.duration;
    trackName = data.spotify.trackName;

    if (data.spotify.active) {
      image = data.spotify.imgUrl;
    } else {
      image = "SPOTIFY";
    }

    deviceName = data.bluetooth.deviceName;
    if (data.bluetooth.connected) { // @todo refactor out
      if (data.bluetooth.active) { // if bluetooth is connected and active, it takes priority over Spotify
        position = data.bluetooth.position;
        duration = data.bluetooth.duration;
        trackName = data.bluetooth.trackName;
        //check for consensus with Spotify on track name to determine displayed image
        if (data.bluetooth.trackName === data.spotify.trackName){
          image = data.spotify.imageUrl;
        } else {
          image = "BLUETOOTH";
        }
      }
    }
    position = dayjs.duration(position);
    duration = dayjs.duration(duration);
    let positionString = `${position.minutes()}:${position.seconds().toString().padStart(2, "0")}`;
    let durationString = `${duration.minutes()}:${duration.seconds().toString().padStart(2, "0")}`;
    let out = {
      active: active,
      positionString: positionString,
      durationString: durationString,
      trackName: trackName,
      image: image,
      deviceName: deviceName
    };
    //console.log(out);
    return out;
  }
};
