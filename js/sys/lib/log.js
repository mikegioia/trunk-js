/**
 * Log class
 * 
 * Configured for setting up document ready scripts and page specific tasks
 */

var LogClass = Base.extend({
    
    constructor: function() {},
    
    init: function() {
        // set defaults for eventData
        //
        this.eventData.type = App.Const.event_page_view;
        
        App.Log.debug( 'Logging library loaded', 'sys' );
    },
    
    eventData: {},
    
    debug: function( msg /* , prefix */ ) {
        if ( App.Config.log_level >= 4 ) {
            var prefix = ( arguments.length > 1 )
                ? this.getBenchmarkPrefix( arguments[ 1 ] )
                : '';
            console.log( prefix + msg );
        }
    },
    
    info: function( msg /* , prefix */ ) {
        if ( App.Config.log_level >= 3 ) {
            var prefix = ( arguments.length > 1 )
                ? this.getBenchmarkPrefix( arguments[ 1 ] )
                : '';
            console.info( prefix + msg );
        }
    },
    
    warn: function( msg /* , prefix */ ) {
        if ( App.Config.log_level >= 2 ) {
            var prefix = ( arguments.length > 1 )
                ? this.getBenchmarkPrefix( arguments[ 1 ] )
                : '';
            console.warn( prefix + msg );
        }
    },
    
    error: function( msg /*, prefix, data */ ) {
        if ( App.Config.log_level >= 1 ) {
            var prefix = '',
                data = {};
        
            if ( arguments.length > 1 ) {
                if ( _.isString( arguments[ 1 ] ) ) {
                    prefix = this.getBenchmarkPrefix( arguments[ 1 ] );
                }
                if ( _.isObject( arguments[ 1 ] ) ) {
                    data = arguments[ 1 ];
                }
            }
            
            if ( arguments.length == 3 ) {
                data = arguments[ 2 ];
            }
                
            console.error( prefix + msg );
            data.message = msg;
            
            // check if beacon error reporting is enabled, if so phone home
            //
            if ( App.Config.log_error_server ) {
                App.Request.ajaxPost(
                    App.Const.url.log_error_server,
                    data,
                    function() { return; },
                    {
                        error: function() { return; },
                        setStatus: false
                    }
                );
            }
        }
    },
    
    startBenchmark: function( key ) {
        App.benchmark( key );
    },
    
    stopBenchmark: function( key ) {
        App.benchmark( key, true );
    },
    
    getBenchmarkPrefix: function( key ) {
        return '[' + key + ' ' + App.benchmark( key ) + '] ';
    },
    
    // used for event logging. this will submit an ajax request posting to the server.
    //
    // URL should be relative path
    //
    event: function( data /* , url */ ) {
        var url = ( arguments.length > 1 )
            ? arguments[ 1 ]
            : null;
        
        if ( ! url && App.Config.event_url ) {
            url = App.Config.event_url;
        }
        
        if ( ! url ) {
            this.error( 'No event url set for event logging' );
            return false;
        }
        
        url = App.rootPath + url;
        var data = {
            'data' : App.Util.json_encode( $.extend( {}, this.eventData, data ) )
        };
        
        App.Request.ajaxSubmit( url, data, 'post', false );
    }
    
});
