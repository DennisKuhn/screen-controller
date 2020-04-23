
/* must be before you register the audio listener */
if ( !window.wallpaperRegisterAudioListener ) {
    let wallpaperAudioInterval = null;
    window.wallpaperRegisterAudioListener = function( callback ) {
        if ( wallpaperAudioInterval ) {
            // clear the older interval 
            clearInterval( wallpaperAudioInterval );
            wallpaperAudioInterval = null;
        }

        // set new interval
        const data = new Array(64);
        let cnt = 0;
        wallpaperAudioInterval = setInterval( () => {
            cnt++;
            for ( let i = 0; i < 64; i++ ) {
                let v = 1 + Math.sin( (i-cnt)/300)/1.5 + Math.random() * Math.sin(cnt/100)/1.5; // real data can be above 1 as well
                v = Math.max( 0, v );
                data[i] = v;
                data[i+64]= v;
            }
            callback( data );
        }, 100 ); // wallpaper engine gives audio data back at about 30fps, so 33ms it is
    };
}