'use strict';

require('dotenv').config()

const fs = require('fs');
const HomeAssistant  = require('homeassistant');
const { NFC } = require('nfc-pcsc');

const movies = JSON.parse(fs.readFileSync('movies.json'));

// Allow directly playing movie from CLI
let listenForNFC = true
const [ argAction, argValue ] = process.argv.slice(2)
if ((argAction === 'name' || argAction === 'id' ) && argValue !== undefined ) {
  listenForNFC = false
}

const hass = new HomeAssistant({
  host: process.env.HASS_HOST,
  port: process.env.HASS_PORT,
  token: process.env.HASS_TOKEN
});

const timeout = (ms) => (new Promise(resolve => setTimeout(resolve, ms)))

const playMovie = async (movieName, entityID = 'plex_shield') => {
  // Turn on the TV.
  let remoteState = await hass.states.get('remote', 'lounge')
  if (remoteState.state === 'off' || remoteState.attributes.current_activity !== 'Watch TV') {
    console.log('Status: Turning on the TV')
    await hass.services.call('turn_on', 'remote', {
      entity_id: remoteState.entity_id,
      activity: 'Watch TV'
    })
    await timeout(5000)
  } else {
    console.log('Status: TV is already on')
  }

  // Launch Plex.
  let plexState = await hass.states.get('media_player', 'lounge_tv')
  if (plexState.attributes.app_id !== 'com.plexapp.android' && plexState.state !== 'playing') {
    console.log('Status: Launching Plex')
    hass.services.call('select_source', 'media_player', {
      entity_id: state.entity_id,
      source: 'com.plexapp.android'
    })
    await timeout(3000)
  } else {
    console.log('Status: Plex is already running')
  }

  // Play the movie.
  const libraryName = 'Movies'
  console.log(`Status: Playing ${movieName}.`)
  hass.services.call('play_media', 'media_player', {
    entity_id: `media_player.${entityID}`,
    media_content_type: `VIDEO`,
    media_content_id: `{"library_name": "${libraryName}", "video_name": "${movieName}"}`
  }).catch(error => {
    console.error(error)
  })
}

// Check we're connected to Hass.
hass.status().then(response => {
  if (response.message !== 'API running.') {
    throw 'Error: Home Assistant API is not running.'
  }

  console.log('Status: Connected to Home Assistant API.')

  if (listenForNFC) {
    console.log('Status: Looking for NFC reader.')

    const nfc = new NFC();
    nfc.on('reader', reader => {
      console.log(`Status: ${reader.reader.name} detected`)

      reader.on('card', card => {
        let movieID = card.uid
        if (movies.hasOwnProperty(movieID)) {
          const movieName = movies[movieID]
          console.log(`Read: ${movieID}. Playing ${movieName}.`)
          playMovie(movies[movieID])
        }
        else {
          console.error(`Read: ${movieID}. No matching movie.`)
        }
      });

      reader.on('error', error => {
        console.error(`Error: ${reader.reader.name}: ${error.toString()}`)
      });
    });

    nfc.on('error', error => {
      console.error(`Error: ${error.toString()}`)
    });
  } else {
    if (argAction === 'name') {
      const lookupID = Object.keys(movies).find(key => movies[key] === argValue)
      if (lookupID !== undefined) {
        playMovie(movies[lookupID])
      } else {
        console.error(`Error: Unable to find movie with name: ${argValue}`)
      }
    } else if (argAction === 'id') {
      if (movies.hasOwnProperty(argValue)) {
        playMovie(movies[argValue])
      } else {
        console.error(`Error: Unable to find movie with ID: ${argValue}`)
      }
    }
  }
}).catch(error => {
  console.error(error.toString())
});
