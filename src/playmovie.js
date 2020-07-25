const timeout = require('./timeout')

const playMovie = async (movieName, hass, entityID = 'plex_shield') => {

  // Turn on the TV
  let remoteState = await hass.states.get('remote', 'lounge')
  if (remoteState.state === 'off' || remoteState.attributes.current_activity !== 'Watch TV') {
    console.log('Status: Turning on the TV')
    await hass.services.call('turn_on', 'remote', {
      entity_id: remoteState.entity_id,
      activity: 'Watch TV'
    })
    await timeout(5000)
  }

  // Launch Plex.
  hass.states.get('media_player', 'lounge_tv').then((state) => {
    if (state.attributes.app_id !== 'com.plexapp.android' && state.state !== 'playing') {
      console.log('Status: Launching Plex')
      hass.services.call('select_source', 'media_player', {
        entity_id: state.entity_id,
        source: 'com.plexapp.android'
      })
    }
    await timeout(3000)
  })

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

module.exports = playMovie
