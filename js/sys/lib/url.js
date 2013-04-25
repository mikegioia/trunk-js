/**
 * Url class
 */

var UrlClass = Base.extend({
    
    constructor: function() {},

    init: function() {
        App.Log.debug( 'Url library loaded', 'sys' );
    },
    
    gotoUrl: function( url /*, absolute */ ) {
        var absolute = ( arguments.length > 1 )
            ? arguments[ 1 ]
            : false;

        window.location = ( absolute )
            ? url
            : App.rootPath + url;
    },

    // generate an absolute URL
    //
    absolute: function( url ) {
        return App.rootPath + url;
    },

    // get the hash URL into a segments array. if the hash url is #app/search/results the segments
    // array will be:
    //     [ 'app', 'search', 'results' ]
    //
    get: function() {
        var hash = window.location.hash.replace( '#', '' );
        
        var params = App.Util.explode( "/", hash );
        var segments = [];
        
        for ( i in params ) {
            if ( params[ i ].length && params[ i ] != '#!' && params[ i ] != '#' ) {
                segments.push( params[ i ] );
            }
        }
        
        return segments;
    },
    
    // retrieve the nth segment of the hash URL. if the hash url is #app/search/results the 
    // segment( 1 ) would return "app"
    //
    segment: function( /* n */ ) {
        var segments = this.get(),
            n = ( arguments.length > 0 && arguments[ 0 ] > 0 )
                ? arguments[ 0 ]
                : 1;
        
        if ( segments && segments.length >= n ) {
            return ( segments[ n - 1 ].length )
                ? segments[ n - 1 ]
                : null;
        }
        else {
            return null;
        }
    },
    
    // encode a string for a URL. replaces spaces with "+" and escapes other characters.
    //
    encode: function( str /*, justSpaces */ ) {
        var result = "";
        
        for ( i = 0; i < str.length; i++ ) {
            if ( str.charAt( i ) == " ") result += "+";
            else result += str.charAt( i );
        }

        if ( arguments.length > 1 && arguments[ 1 ] == true ) {
            return result;
        }
        
        return escape( result );
    },
    
    // decode a URL
    //
    decode: function( str ) {
        return str.replace( /\+/g, " " );
    },

    // register the function on hash change event
    //
    hashChange: function( hashFunction ) {
        $( window ).hashchange( hashFunction );
    },

    // trigger the hashChange event
    //
    triggerHashChange: function() {
        $( window ).hashchange();
    },

    // set a hash parameter
    //
    setHashParam: function( param /*, value*/ ) {
        var params = this.getHashParams(),
            newParams = {};

        if ( arguments.length > 1 ) {
            var value = arguments[ 2 ];
            newParams[ param ] = value;
        }
        else {
            newParams = param;
        }

        for ( i in newParams ) {
            if ( newParams[ i ] === null ) {
                delete params[ i ];
            }
            else {
                params[ i ] = newParams[ i ].toString();
            }
        }

        this.updateHashParams( params );
    },

    // get hash parameter
    //
    getHashParam: function( param ) {
        var params = this.getHashParams();

        if ( ! _.isUndefined( params[ param ] ) ) {
            return params[ param ];
        }

        return null;
    },

    // return an object of hash parameters
    //
    getHashParams: function() {
        var hash = window.location.hash,
            params = {};

        // clear # and #!
        //
        if ( hash && hash.length ) {
            if ( hash.substring( 0, 2 ) == '#!' ) {
                hash = hash.substring( 2 );
            }
            else if ( hash.substring( 0, 1 ) == '#' ) {
                hash = hash.substring( 1 );
            }
        }

        var vars = hash.split( '&' );

        // build params into an object
        //
        for ( var i = 0; i < vars.length; i++ ) {
            var pair = vars[ i ].split( '=' );

            if ( pair.length > 0 && pair[ 0 ].length > 0 )
            {
                params[ pair[ 0 ] ] = ( pair.length > 1 )
                    ? this.decode( pair[ 1 ] )
                    : null;
            }
        }

        return params;
    },

    // encode an object into hash parameters and set it in the URL
    //
    updateHashParams: function( /* params */ ) {
        var hash = []
            params = ( arguments.length > 0 )
                ? arguments[ 0 ]
                : [];

        for ( i in params ) {
            hash.push( i + "=" + this.encode( params[ i ], true ) );
        }

        window.location.hash = hash.join( '&' );
    },

    // get a query parameter by name
    //
    getParameterByName: function( name ) {
        name = name.replace( /[\[]/, "\\\[").replace(/[\]]/, "\\\]" );
        
        var regexS = "[\\?&]" + name + "=([^&#]*)",
            regex = new RegExp( regexS ),
            results = regex.exec( window.location.search );

        return ( results == null )
            ? ""
            : decodeURIComponent( results[ 1 ].replace( /\+/g, " " ) );
    }

});




// End of file
