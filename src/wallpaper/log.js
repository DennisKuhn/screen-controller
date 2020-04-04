const zeroPad = (num, places) => String(num).padStart(places, '0');

function _getErrorObject() {
    try {
        throw Error(''); 
    } catch (err) {
        return err; 
    }
}
		
export default function log() {
    this.consoleLog = null;
    this.consoleWarn = null;
    this.consoleError = null;
    this.hook();
	
    this.htmlElement = document.createElement('div');
    this.htmlElement.id = 'log';
    this.contentElement = document.createElement('pre');
    this.buttonElement = document.createElement('button');
	
    this.htmlElement.appendChild( this.contentElement );
    this.htmlElement.appendChild( this.buttonElement );
	
    this.htmlElement.style.position = 'fixed';
    this.htmlElement.style.right = 0;
    this.htmlElement.style.bottom= 0;
    this.htmlElement.style.background = 'rgba( 0, 0, 0, 196 )';
    this.htmlElement.style.color = 'white';
    this.htmlElement.style.zIndex = '1000';
    this.htmlElement.style.visibility = 'visible';
    this.htmlElement.style.width = 100 + '%';
    this.htmlElement.style.height = 10 + '%';
	
    this.buttonElement.style.position = 'absolute';
    this.buttonElement.style.right = 0;
    this.buttonElement.style.top= 0;
    this.buttonElement.style.color = 'red';
    this.buttonElement.style.zIndex = '1000';
    this.buttonElement.innerHTML = '&times;';
	
    this.contentElement.style.width = 100 + '%';
    this.contentElement.style.height = 100 + '%';
    this.contentElement.style.overflow = 'auto';
	
    const self = this;
    var bodyCheckTimeout = function() {
        if ( document.body && document.body.appendChild ) {
            document.body.appendChild( self.htmlElement );
        } else {
            setTimeout( function() {
                bodyCheckTimeout(); 
            }, 1 );
        }
    };
    setTimeout( function() {
        bodyCheckTimeout(); 
    }, 100 );
	
    this.buttonElement.addEventListener('click', function() {
        self.hide();
        self.clear();
    });
	
    this.append( 'log started' );
	
}

log.prototype = {
    show: function() {
        this.htmlElement.style.display = 'block'; 
    },
    hide: function() {
        this.htmlElement.style.display = 'none'; 
    },
    hook: function() {
        const self = this;
		
		
	    this.console = window.console;
	    this.consoleLog = window.console.log;
	    this.consoleWarn = window.console.warn;
	    this.consoleError = window.console.error;
	    
	    window.console.log = function() {
            self.show();
	       self.append.apply( self, arguments );
	       self.consoleLog.apply(window.console, arguments);
	    };
	    window.console.warn = function() {
            self.show();
	        self.append.apply( self, arguments );
            self.consoleWarn.apply(window.console, arguments);
        };
	    window.console.error = function() {
            // do sneaky stuff
            self.show();
	        self.append.apply( self, arguments );
            self.consoleError.apply(window.console, arguments);
        };
        // window.onerror = function( message, url, linenumber, columnNo, error )
        // {
        //	console.error( message, url, linenumber, columnNo, error );
  		//	return false;
        //};
    },
    clear: function() {
        while (this.contentElement.firstChild) {
            this.contentElement.removeChild(this.contentElement.firstChild);
        }
    },
    append: function(  ) {

        try {
            // var err = _getErrorObject();
            // var caller_line = err.stack.split("\n");
            // caller_line = caller_line[caller_line.length-1];
            // var index = caller_line.indexOf("at ");
            // var clean = caller_line.slice(index+2, caller_line.length);
			
            for (let i = 0; i < arguments.length; i++ ) {
                try {
                    const timestamp = new Date(performance.now());
                    const timetext = Math.trunc(timestamp.getTime() / (1000 * 60 * 60 )) + ':' + zeroPad( timestamp.getUTCMinutes(), 2) + ':' + zeroPad( timestamp.getUTCSeconds(), 2) + '.' + zeroPad( timestamp.getUTCMilliseconds(), 3);

                    let obj = arguments[i];
                    //console.log( caller_line, index, clean );
                    if ( typeof obj == 'object' ) obj = JSON.stringify( obj, null, 2 );
					
                    const el = document.createElement('div');
                    // el.innerHTML = clean.replace( /^\s+/g, '' ).replace( /(http|file).+\//g, '' ) 
                    // 			 + ": " + obj;
                    el.innerHTML = timetext + ': ' + obj;
                    this.contentElement.insertBefore(el, this.contentElement.firstChild);
                    //this.contentElement.appendChild( el );
                    while ( this.contentElement.childNodes.length > 100 ) {
                        this.contentElement.removeChild(this.contentElement.lastChild);
                    }
                } catch (ex) {
                    console.log( ex );
                }
            }
        } catch (ex) {
            console.log( ex );
        }
    }
	
};

// window.log = new log();
