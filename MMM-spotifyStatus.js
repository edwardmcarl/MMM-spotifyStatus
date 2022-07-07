Module.register("MMM-spotifyStatus", {
  defaults: {
    name: "raspberrypi"
  },

  start: function() {
    this.factory = new DomFactory(this.file(""));
  },
  
  getScripts: function () {
    return [this.file("./js/DomFactory.js")];
  },

  getStyles: function () {
    return [this.file("./css/nowPlaying.css")];
  },

  getDom: function () {
    return this.factory.buildDom(this.playerState);
  },

  notificationReceived: function (notification, payload, sender) {
    if (notification === "MODULE_DOM_CREATED") {
      Log.info("sent api startup request");
      let pay = {
        clientId: this.config.clientId,
        clientSecret: this.config.clientSecret,
        refreshToken: this.config.refreshToken
      };
      Log.info(pay);
      Log.info(this.config);
      this.sendSocketNotification("SPOTIFYSTATUS_SEND_CONFIG", this.config);
      this.sendSocketNotification("SPOTIFYSTATUS_BEGIN_UPDATES", pay);
    }
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "SPOTIFYSTATUS_API_RESULTS") {
      this.playerState = payload;
      this.updateDom();
    }
  }
});
