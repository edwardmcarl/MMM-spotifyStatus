class DomFactory {
  constructor(playerState, path) {
    this.playerState = playerState;
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

    if (this.playerState === undefined || !this.playerState.active) {
      this.buildLogoImg(frame);
    } else {
      this.buildAlbumImg(frame);
      this.buildTrackName(wrapper);
      //wrapper.appendChild(track);
      this.buildProgressText(wrapper);
    }

    return wrapper;
  }

  buildAlbumImg(frame) {
    let img = document.createElement("img");
    img.setAttribute("class", "albumArt");
    img.setAttribute("src", this.playerState.imgUrl);
    frame.appendChild(img);
  }

  buildLogoImg(frame) {
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
    text.innerHTML = `${this.playerState.progressStamp}/${this.playerState.durationStamp}`;
    wrapper.appendChild(text);
  }
}
