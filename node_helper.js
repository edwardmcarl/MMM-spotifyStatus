const NodeHelper = require("node_helper");
const SpotifyWebApi = require("spotify-web-api-node");
const dayjs = require("dayjs");
const duration = require("dayjs/plugin/duration");
const isSameOrAfter = require("dayjs/plugin/isSameOrAfter");
dayjs.extend(isSameOrAfter);
dayjs.extend(duration);

module.exports = NodeHelper.create({
  start: function () {
    this.api = undefined;
    this.validUntil = undefined;
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "SPOTIFYSTATUS_BEGIN_UPDATES") {
      console.log("Received Spotify API startup signal");
      if (this.api === undefined) {
        console.log("Creating API object with credentials:");
        console.log(payload);
        this.api = new SpotifyWebApi({
          clientId: payload.clientId,
          clientSecret: payload.clientSecret,
          refreshToken: payload.refreshToken
        });

        this.ensureAccessToken();
        setInterval(() => {
          this.ensureAccessToken();
          this.api.getMyCurrentPlaybackState().then((results) => {
            this.sendSocketNotification("SPOTIFYSTATUS_API_RESULTS", this.processPlayerData(results.body));
          });
        }, 1000);
      }
    }
  },

  processPlayerData: function (apiResult) {
    if (apiResult.item === null || apiResult.item === undefined) {
      return {
        active: false,
        imgUrl: null,
        progressStamp: null,
        durationStamp: null
      };
    }

    let imgUrl = apiResult.item.album.images[0].url;
    let trackName = apiResult.item.name;
    let progress = dayjs.duration(apiResult.progress_ms);
    let duration = dayjs.duration(apiResult.item.duration_ms);
    let progressStamp = `${progress.minutes()}:${progress.seconds().toString().padStart(2, "0")}`;
    let durationStamp = `${duration.minutes()}:${duration.seconds().toString().padStart(2, "0")}`;

    return {
      active: true,
      imgUrl: imgUrl,
      trackName: trackName,
      progressStamp: progressStamp,
      durationStamp: durationStamp
    };
  },

  ensureAccessToken: function () {
    if (
      this.validUntil === undefined ||
      dayjs().isSameOrAfter(this.validUntil)
    ) {
      this.api.refreshAccessToken().then(
        (result) => {
          console.log("Refreshed token:");
          console.log(result.body);
          this.api.setAccessToken(result.body.access_token);
          let lastRefreshed = dayjs();
          this.validUntil = lastRefreshed.add(result.body.expires_in, "seconds");
        },
        (err) => console.error(err)
      );
    }
  }
});
