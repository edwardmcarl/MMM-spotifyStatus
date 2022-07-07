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
    if (data !== undefined) {
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

    let position, duration, positionString, durationString, trackName, image;
    // Determine image
    image = this.getImage(data)

     // by default, use Spotify data
    position = data.spotify.position;
    duration = data.spotify.duration;
    trackName = data.spotify.trackName;

    // if bluetooth is connected and active, it takes priority over Spotify for track info
    if (data.bluetooth.connected && data.bluetooth.active) {
      position = data.bluetooth.position;
      duration = data.bluetooth.duration;
      trackName = data.bluetooth.trackName;
    }

    [positionString, durationString] = this.getProgressStrings(position, duration);

    let out = {
      active: playerActive,
      positionString: positionString,
      durationString: durationString,
      trackName: trackName,
      image: image,
      bluetoothDevice: data.bluetooth.deviceAlias,
      spotifyDevice: data.spotify.device
    };
    //console.log(out);
    return out;
  }

  getImage(data) {
    console.log(data)
    if (data.bluetooth.connected && data.bluetooth.active) {
      if ((data.bluetooth.trackname !== null) && data.spotify.trackName === data.bluetooth.trackName) {
        return data.spotify.imgUrl;
      } else {
        return "BLUETOOTH";
      }
    } else {
      if (data.spotify.active) {
        return data.spotify.imgUrl;
      } else {
        return "SPOTIFY";
      }
    }

  }

  getProgressStrings(positionMs, durationMs) {
    if (positionMs !== null && durationMs !== null && durationMs !== 0) {
      let positionDuration = dayjs.duration(positionMs);
      let durationDuration = dayjs.duration(durationMs);
      let positionString = `${positionDuration.minutes()}:${positionDuration.seconds().toString().padStart(2, "0")}`;
      let durationString = `${durationDuration.minutes()}:${durationDuration.seconds().toString().padStart(2, "0")}`;
      return [positionString, durationString];
    } else {
      return [null, null];
    }
  }


};
