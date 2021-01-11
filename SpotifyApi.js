const axios = require('axios');
const dayjs = require('dayjs');
const SpotifyWebApi = require('spotify-web-api-node');
var isSameOrAfter = require('dayjs/plugin/isSameOrAfter')
dayjs.extend(isSameOrAfter)
module.exports = class SpotifyApi {
    constructor (creds){
        this.clientId = creds.clientId;
        this.clientSecret = creds.clientSecret;
        this.accessToken = undefined;
        this.refreshToken = creds.refreshToken;
        let bu = Buffer.from(`${this.clientId}:${this.clientSecret}`);
        this.basicHeader = { 'Authorization': 'Basic '.concat(bu.toString('base64')), 'Content-Type':'application/x-www-form-urlencoded'}; //btoa not defined in Node
        console.log(this.basicHeader)
        this.validUntil = dayjs();
    }

    getBearerHeader() {
        return {'Authorization': ('Bearer ' +   this.accessToken), 'Content-Type':'application/x-www-form-urlencoded'}
    }

    async refreshAccess() {
        console.log("Refreshing token")
        let startTime = dayjs();
        let response = await axios.request({
            url: 'https://accounts.spotify.com/api/token',
            method: 'post',
            headers: this.basicHeader,
            params: {
                grant_type: 'refresh_token',
                refresh_token: this.refreshToken
            }
        });
        console.log(response)
        this.validUntil = startTime.add(response.expires_in, 'seconds');
        this.accessToken = response.access_token;
    }

    async getPlayerData() {
        let response = await axios.request({
            url: 'https://api.spotify.com/v1/me/player',
            method: 'get',
            headers: this.getBearerHeader()
        })
        console.log(response);

        return response;
        //GET https://api.spotify.com/v1/me/player
        //header: getBearerHeader()

        //extract length, progress, and image, then return them
        
    }

    async servePlayerData(){
        //check time, refresh access if needed
        //then getPlayerData()
        if (dayjs().isSameOrAfter(this.validUntil)){
            await this.refreshAccess();
        }
        return await this.getPlayerData();
    }

}

