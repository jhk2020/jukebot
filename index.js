require('dotenv').load();

const natural = require('natural');
const createSlackEventAdapter = require('@slack/events-api').createSlackEventAdapter;
const SpotifyWebApi = require('spotify-web-api-node');

const port = process.env.PORT || 3000;

const slackEvents = createSlackEventAdapter(process.env.SLACK_TOKEN);

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

spotifyApi.clientCredentialsGrant()
  .then(data => {
    console.log(`The access token expires in ${data.body['expires_in']}`);
    console.log(`The access token in ${data.body['access_token']}`);
    
    spotifyApi.setAccessToken(data.body['access_token'], err => console.log(err));
  })

slackEvents.on('message', event => {
  if (event.text.indexOf('add') === 0) {
    const tokens = event.text.slice(4).split('-'); // slice out keyword 'add'

    if (tokens[0] === undefined || tokens[1] === undefined) {
      return;
    }

    const artist = tokens[0].trim();
    const track = tokens[1].trim();
    
    const query = `track:${track} artist:${artist}`;
    console.log(query)
    spotifyApi.searchTracks(query)
      .then(data => {
        const track = data.body.tracks.items[0];
        return track;
      })
      .then(track => {
        // save song to database
        
        // return spotifyApi.addTracksToPlaylist(process.env.SPOTIFY_USER, process.env.SPOTIFY_PLAYLIST, [`spotify:track:${track.id}`]);
      })
      .catch(e => console.error(e));
  }
  
  
});

slackEvents.on('error', console.error);

slackEvents.start(port).then(() => console.log(`server listening on port ${port}`));

/* set up cron event that, on every monday:
  - fetches saved song ids for the past week
  - adds to public playlist
  - deletes all saved songs
*/