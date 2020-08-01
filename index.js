'use strict';

require('dotenv').config()

const fs = require('fs');
const HomeAssistant  = require('homeassistant');
const { NFC } = require('nfc-pcsc');

const content = JSON.parse(fs.readFileSync('contentId.json'));

const hass = new HomeAssistant({
  host: process.env.HASS_HOST,
  port: process.env.HASS_PORT,
  token: process.env.HASS_TOKEN
});

const timeout = (ms) => (new Promise(resolve => setTimeout(resolve, ms)))

const playContent = async (content, entityID = 'plex_shield') => {
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

  const serviceData = {
    entity_id: `media_player.${entityID}`,
    media_content_type: content.type
  }
  switch (content.type) {
    case 'VIDEO':
      console.log(`Status: Playing ${content.videoName} from ${content.libraryName}.`)
      serviceData.media_content_id = JSON.stringify({
        "library_name": content.libraryName,
        "video_name": content.videoName
      })
      break;
    case 'PLAYLIST':
      console.log(`Status: Playing ${content.playlistName} ${(content.shuffle ? ' on shuffle' : '')}`)
      serviceData.media_content_id = JSON.stringify({
        "playlist_name ": content.playlistName,
        "shuffle": (content.shuffle ? '1' : '0')
      })
      break;
    case 'MUSIC':
    case 'EPISODE':
      console.error(`Error: ${content.type} support is not currently implemented.`)
      break;
  }

  if (serviceData.media_content_id)
  hass.services.call('play_media', 'media_player', serviceData).catch(error => {
    console.error(error)
  })

}

// Check we're connected to Hass.
hass.status().then(response => {
  if (response.message !== 'API running.') {
    throw 'Error: Home Assistant API is not running.'
  }

  console.log('Status: Connected to Home Assistant API.')
  console.log('Status: Looking for NFC reader.')

  const nfc = new NFC();
  nfc.on('reader', reader => {
    console.log(`Status: ${reader.reader.name} detected`)

    reader.on('card', card => {
      let contentID = card.uid
      if (content.hasOwnProperty(contentID)) {
        const contentObject = content[contentID]
        console.log(`Read: ${contentID}. Matching content ${contentObject}.`)
        playContent(contentObject)
      }
      else {
        console.error(`Read: ${contentID}. No matching content.`)
      }
    });

    reader.on('error', error => {
      console.error(`Error: ${reader.reader.name}: ${error.toString()}`)
    });
  });

  nfc.on('error', error => {
    console.error(`Error: ${error.toString()}`)
  });

}).catch(error => {
  console.error(error.toString())
});
