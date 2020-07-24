'use strict';

require('dotenv').config()

const fs = require('fs');
const HomeAssistant  = require('homeassistant');
const { NFC } = require('nfc-pcsc');

const playMovie = require('./src/playmovie')

const movies = JSON.parse(fs.readFileSync('movies.json'));

const hass = new HomeAssistant({
  host: process.env.HASS_HOST,
  port: process.env.HASS_PORT,
  token: process.env.HASS_TOKEN
});

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


}).catch(error => {
  console.error(error.toString())
});
