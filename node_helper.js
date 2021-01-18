/* eslint-disable prettier/prettier */
const NodeHelper = require("node_helper");
const SpotifyWebApi = require("spotify-web-api-node");
const dayjs = require("dayjs");
const duration = require("dayjs/plugin/duration");
const isSameOrAfter = require("dayjs/plugin/isSameOrAfter");
const dbus = require("dbus-next");
const Variant = dbus.Variant;
const DataIntegrator = require("./js/DataIntegrator.js");
dayjs.extend(isSameOrAfter);
dayjs.extend(duration);

module.exports = NodeHelper.create({
  start: function () {
    // Spotify
    this.api = undefined;
    this.validUntil = undefined;

    // DBus
    this.bus = dbus.systemBus();
    this.bus.getProxyObject("org.bluez", "/").then((result) => {
      this.obj = result;
      this.manager = this.obj.getInterface("org.freedesktop.DBus.ObjectManager");
    }, (err) => console.log(err));
    
    // Bluetooth
    this.deviceStates = {};
    this.bluetoothPlayerInterface = undefined;
    this.currentDevice = undefined;
    
    this.integrator = new DataIntegrator();
    console.log("finished setup")
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "SPOTIFYSTATUS_BEGIN_UPDATES") {
      console.log("Received startup signal");
      if (this.api === undefined) {
        console.log("Creating Spotify API object with credentials:");
        console.log(payload);
        this.api = new SpotifyWebApi({
          clientId: payload.clientId,
          clientSecret: payload.clientSecret,
          refreshToken: payload.refreshToken
        });

        this.ensureAccessToken();
        setInterval(async () => {
          this.ensureAccessToken();
          let apiResult = await this.api.getMyCurrentPlaybackState();
          let bluetoothData = await this.getBluetoothData();
          let spotifyData = this.processSpotifyData(apiResult.body);
          console.log(spotifyData);
          let payload = this.integrator.integrateSpotifyBluetooth({bluetooth: bluetoothData, spotify: spotifyData});
          this.sendSocketNotification("SPOTIFYSTATUS_API_RESULTS", payload);
        }, 1000);
      }

      this.bus.getProxyObject("org.bluez", "/org/bluez/hci0").then(async r => {
        console.log("Paired Bluetooth Devices:");
        let anyDevices = false;
        for (let deviceName of r.nodes){
          anyDevices = true;
          console.log(deviceName)
        }
        if (!anyDevices){
          console.log("no devices found!")
        }

        for (let i = 0; i < 1/* r.nodes.length */; i++){

          let deviceName = r.nodes[i];
          this.deviceStates[deviceName] = {connected: false, playerListenerCreated: false};
          anyDevices = true;
          let deviceTopNode = await this.bus.getProxyObject("org.bluez", deviceName)
            .catch(err => console.log(err));
          //console.log(deviceTopNode);
          let devicePlayerNode = await this.bus.getProxyObject("org.bluez", deviceName + "/player0")
            .catch(err => {console.log(`No player found for device ${deviceName}`)});
          //console.log(devicePlayerNode)
          let deviceProperties = deviceTopNode.getInterface("org.freedesktop.DBus.Properties");
          
         
          try {
            this.setBluetoothInterface(devicePlayerNode, deviceName);
          } catch (err){
            console.log(`No player found on startup for ${deviceName}`)
          }

          deviceProperties.on("PropertiesChanged", async (iface, changed, invalidated) => {
            //console.log("PROPERTY CHANGED")
            //console.log(iface);
            if (iface === "org.bluez.Device1") {
              //console.log(changed);
              for (let property of Object.keys(changed)){
                if (property === "Connected") {
                  let x = changed[property];
                  if (x.value === true) {
                      console.log(`Creating D-Bus Bluetooth interface for new connection: ${deviceName}`);
                      let iterations = 0;
                      let retries = setInterval(async () => {
                        try{
                          let updatedDevicePlayerNode = await this.bus.getProxyObject("org.bluez", deviceName + "/player0")
                          this.setBluetoothInterface(updatedDevicePlayerNode, deviceName);
                          clearInterval(retries);
                          setInterval(async () => console.log(await this.getBluetoothData()), 4000);
                        } catch (err) {
                          console.log("retrying...")
                          iterations = iterations + 1;
                          if (iterations > 15){
                            clearInterval(retries);
                            console.log(`Listener creation timed out for ${deviceName}. Maybe disconnect and reconnect? Final error:`)
                            console.log(err);
                          }
                        }
                      }, 1000);
                  } else {
                    this.deviceStates[deviceName].connected = false;
                    console.log(`Device disconnected: ${deviceName}`);
                  }
                  console.log(this.deviceStates)
                }
              }
            }
          });
        }
      }, err => console.log(err));
    }
  },

  setBluetoothInterface: function(playerNode, deviceName) {
    let mediaPlayer = playerNode.getInterface("org.freedesktop.DBus.Properties");
    console.log(`Successfully created player interface to ${deviceName}`);
    this.bluetoothPlayerInterface = mediaPlayer;
    //console.log(this.bluetoothPlayerInterface);
    //this.currentDevice = deviceName;
    this.deviceStates[deviceName].connected = true;
  },

  isBluetoothConnected: function(){
    for (let deviceName of Object.keys(this.deviceStates)){
      if (this.deviceStates[deviceName].connected){
        return {connected: true, deviceName: deviceName};
      }
    }
    return {connected: false, deviceName: null};
  },

  getBluetoothData: async function () {  //@todo refactor heavily
    let connectionStatus = this.isBluetoothConnected();
    if (!connectionStatus.connected){
      return {
        connected: false,
        active: null,
        deviceName: null,
        trackName: null,
        progress: null,
        duration: null
      }
    }
    if (this.bluetoothPlayerInterface === undefined){
      console.error("Connected to device , but no interface established!")
      return {
        connected: false,
        active: null,
        deviceName: null,
        trackName: null,
        progress: null,
        duration: null
      }
    }
    
    // otherwise, assume we have the right interface selected
    let positionVariant = await this.bluetoothPlayerInterface.Get("org.bluez.MediaPlayer1", "Position");
    let trackVariant = await this.bluetoothPlayerInterface.Get("org.bluez.MediaPlayer1", "Track");
    let active = true;
    if (trackVariant.value.Title.value === "Not Provided"){
      active = false;
    }
    return {
      connected: true,
      active: active,
      deviceName: connectionStatus.deviceName,
      trackName: trackVariant.value.Title.value,
      position: positionVariant.value,
      duration: trackVariant.value.Duration.value
    }
  },

  processSpotifyData: function (apiResult) {

    if (apiResult.item === null || apiResult.item === undefined) {
      return {
        active: false,
        imgUrl: null,
        trackName: null,
        position: null,
        duration: null
      };
    }
    
    let progress = apiResult.progress_ms
    let stamp = apiResult.timestamp
    let duration = apiResult.item.duration_ms;
    console.log(`Progress: ${progress}`)
    console.log(`Stamp: ${stamp}`)
    console.log(`Duration: ${duration}`)
    return {
      active: true,
      imgUrl: apiResult.item.album.images[0].url,
      trackName: apiResult.item.name,
      position: apiResult.progress_ms,
      duration: apiResult.item.duration_ms
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
