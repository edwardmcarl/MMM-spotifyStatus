class DomFactory {
  constructor(path) {
    this.path = path;
  }

  buildDom(data) {
    let wrapper = document.createElement("div");
    let frame = document.createElement("div");

    let text = document.createElement("div");
    let track;
    frame.setAttribute("id", "frame");

    text.setAttribute("id", "progressText");

    wrapper.appendChild(frame);

    if (data === undefined){
      this.buildSpotifyLogoImg(frame);
      return wrapper;
    }
    console.log(data);
    if (data.image === "BLUETOOTH") {
      this.buildBluetoothLogoImg(frame);
    } else if (data.image === "SPOTIFY") {
      this.buildSpotifyLogoImg(frame);
    } else {
      this.buildAlbumImg(frame, data);
    }
    
    if (data.active) {
      this.buildTrackName(wrapper, data);
      this.buildProgressText(wrapper, data);
    }
    if (data.bluetoothDevice !== null) {
      this.buildDeviceNotice(wrapper, data);
    }

    return wrapper;
  }

  buildAlbumImg(frame, data) {
    let img = document.createElement("img");
    img.setAttribute("class", "albumArt");
    img.setAttribute("src", data.image);
    frame.appendChild(img);
  }

  buildBluetoothLogoImg(frame) {
    let img = document.createElement("img");
    img.setAttribute("class", "bluetoothLogo");
    img.setAttribute("src", this.path + "/media/Bluetooth_FM_Color.png");
    frame.appendChild(img);
  }

  buildDeviceNotice(frame, data) {
    let deviceNotice = document.createElement("div");
    deviceNotice.setAttribute("class", "trackCaption");
    deviceNotice.setAttribute("id", "deviceNotice");
    deviceNotice.innerHTML = `Bluetooth connected: ${data.bluetoothDevice}`;
    frame.appendChild(deviceNotice);
  }

  buildSpotifyLogoImg(frame) {
    let img = document.createElement("img");
    img.setAttribute("class", "spotifyLogo");
    img.setAttribute("src", this.path + "/media/Spotify_Icon_RGB_Green.png");
    frame.appendChild(img);
  }

  buildTrackName(wrapper, data) {
    let trackName = document.createElement("div");
    trackName.setAttribute("class", "trackCaption");
    trackName.setAttribute("id", "trackName");
    trackName.innerHTML = (data.trackName === null) ? "Unknown" : data.trackName;
    wrapper.appendChild(trackName);
  }

  buildProgressText(wrapper, data) {
    if (data.positionString === null || data.durationString === null ){
      return;
    }
    let text = document.createElement("div");
    text.setAttribute("class", "trackCaption")
    text.setAttribute("id", "progressText");
    text.innerHTML = `${data.positionString}/${data.durationString}`;
    wrapper.appendChild(text);
  }
}
