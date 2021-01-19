const dayjs = require("dayjs");
const duration = require("dayjs/plugin/duration");
dayjs.extend(duration);

module.exports = class DataIntegrator {
  constructor(name) {
    this.name = name;
  }

  integrateSpotifyBluetooth(data) {
    /*
      - Bluetooth takes priority for track and progress
      - if Bluetooth and Spotify agree, we insert Spotify album art
      - if Bluetooth is active but disagrees with Spotify, pick bluetooth
      - if Bluetooth is inactive, rely on Spotify for everything
    */
    //console.log(data);
    let spotifyActive, playerActive;
    if (data !== undefined){
      spotifyActive = (data.spotify.active && (data.spotify.device === this.name));
      playerActive = spotifyActive || data.bluetooth.active;
    }
    if (data === undefined || !playerActive) {
      return {
        active: false,
        image: "SPOTIFY",
        bluetoothDevice: null
      };
    }

    let position, duration, trackName, image, bluetoothDevice, active, badInterface, spotifyDevice;

    badInterface = data.bluetooth.badInterface;
    bluetoothDevice = data.bluetooth.deviceAlias; // @todo have this interact with "connected"

    spotifyDevice = data.spotify.device;
    position = data.spotify.position;
    duration = data.spotify.duration;
    trackName = data.spotify.trackName;

    // Determine image
    if (data.bluetooth.connected && data.bluetooth.active) {
      if (data.spotify.trackName === data.bluetooth.trackName) {
        image = data.spotify.imgUrl;
      } else {
        image = "BLUETOOTH";
      }
    } else {
      if (data.spotify.active) {
        image = data.spotify.imgUrl;
      } else {
        image = "SPOTIFY";
      }
    }

    // if bluetooth is connected and active, it takes priority over Spotify for track info
    if (data.bluetooth.connected && data.bluetooth.active) {
      position = data.bluetooth.position;
      duration = data.bluetooth.duration;
      trackName = data.bluetooth.trackName;
    }

    if (position !== null && duration !== null && duration !== 0) {
      position = dayjs.duration(position);
      duration = dayjs.duration(duration);
      position = `${position.minutes()}:${position.seconds().toString().padStart(2, "0")}`;
      duration = `${duration.minutes()}:${duration.seconds().toString().padStart(2, "0")}`;
    } else {
      position = null;
      duration = null;
    }
    let out = {
      badInterface: badInterface,
      active: playerActive,
      positionString: position,
      durationString: duration,
      trackName: trackName,
      image: image,
      bluetoothDevice: bluetoothDevice,
      spotifyDevice: spotifyDevice
    };
    //console.log(out);
    return out;
  }
};
