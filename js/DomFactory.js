class DomFactory {
  constructor(data, path) {
    this.playerState = data;
    this.path = path;
  }

  buildDom() {
    let wrapper = document.createElement("div");
    let frame = document.createElement("div");

    let text = document.createElement("div");
    let track;
    frame.setAttribute("id", "frame");

    text.setAttribute("id", "progressText");

    wrapper.appendChild(frame);

    if (this.playerState === undefined){
      this.buildSpotifyLogoImg(frame);
      return wrapper;
    }

    if (this.playerState.image === "BLUETOOTH") {
      this.buildBluetoothLogoImg(frame);
    } else if (this.playerState.image === "SPOTIFY") {
      this.buildSpotifyLogoImg(frame);
    } else {
      this.buildAlbumImg(frame);
    }

    if (this.playerState.active) {
      this.buildTrackName(wrapper);
      this.buildProgressText(wrapper);
    }
    if (this.playerState.deviceName !== null) {
      this.buildDeviceNotice(wrapper);
    }

    return wrapper;
  }

  buildAlbumImg(frame) {
    let img = document.createElement("img");
    img.setAttribute("class", "albumArt");
    img.setAttribute("src", this.playerState.image);
    frame.appendChild(img);
  }

  buildBluetoothLogoImg(frame) {
    let img = document.createElement("img");
    img.setAttribute("class", "bluetoothLogo");
    img.setAttribute("src", this.path + "/media/Bluetooth_FM_Color.png");
    frame.appendChild(img);
  }

  buildDeviceNotice(frame) {
    let deviceNotice = document.createElement("div");
    deviceNotice.setAttribute("id", "deviceNotice");
    deviceNotice.innerHTML = `Bluetooth connected: ${this.playerState.deviceName}`;
    frame.appendChild(deviceNotice);
  }

  buildSpotifyLogoImg(frame) {
    let img = document.createElement("img");
    img.setAttribute("class", "spotifyLogo");
    img.setAttribute("src", this.path + "/media/Spotify_Icon_RGB_Green.png");
    frame.appendChild(img);
  }

  buildTrackName(wrapper) {
    let trackName = document.createElement("div");
    trackName.setAttribute("id", "trackName");
    trackName.innerHTML = this.playerState.trackName;
    wrapper.appendChild(trackName);
  }

  buildProgressText(wrapper) {
    let text = document.createElement("div");
    text.setAttribute("id", "progressText");
    text.innerHTML = `${this.playerState.positionString}/${this.playerState.durationString}`;
    wrapper.appendChild(text);
  }

  
}
