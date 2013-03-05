/**
 * Request class
 * 
 * Handles all HTTP requests, both asynchronous and synchronous. Contains error handling and
 * optional failure logging.
 * 
 * If success is set, overwrite the success. if onSuccess is set, call that before the 
 * remaining success callback only if it evaluates to true.
 *
 * Response format for callbacks:
 *   -> status      Response status
 *   -> message     Response message
 *   -> html        Array with elements of the form target => content
 *   -> script      JavaScript code to execute
 *   -> redirect    Redirect to a URL
 *   -> data        Any data variables coming with the payload
 */

var RequestClass = Base.extend({
    
    constructor: function() {},
    
    localStorageEnabled: false,
    localStorageNotified: false,
    hook: false,
    
    // default parameters for ajax form. options include:
    //
    //     beforeSend       executed before form submits
    //     onSuccess        executed when successful complete
    //     onError          executed when an error status comes back
    //     postSuccess      executed after all success handlers finished
    //     dataType         type of expected data returned
    //     *waitComplete    prevent multiple requests at the same time for form
    //
    // as well as any other option that jQuery .ajax takes
    // *not implemented
    //
    defaults: {
        dataType: 'json',
        data: {
            ajax: true
        },
        setStatus: true,
        statusMessage: null,
        expire_notification: true
    },
    
    // initialize the ajax/request library
    //
    init: function() {
        var self = this;
        
        // set up the local storage for offline. call method to send any
        // stored requests (if there are any).
        //
        App.ready( function() {
            if ( App.Const.request_local_storage ) {
                self.localStorageEnabled = Modernizr.localstorage;
                self.sendStoredRequests();
            }

            // change default notification expiration
            //
            self.defaults.expire_notification = App.Config.message_expire;
        });
        
        App.Log.debug( 'Request library loaded', 'sys' );
    },
    
    // set up the form for ajax submit. overwrite and options and set up the defaults
    //
    ajaxForm: function( form /*, formOptions */ ) {
        var formOptions = ( arguments.length > 1 )
            ? arguments[ 1 ]
            : {};
        var $form = ( _.isString( form ) )
            ? $( form )
            : form;
        var options = this.getOptions( formOptions );

        options.data = $.extend( true, this.defaults.data, options.data );

        $form.ajaxForm( options );
    },
    
    // prepare the options for an ajax form
    //
    getOptions: function( formOptions ) {
        var self = this,
            options = _.extend( {}, this.defaults, formOptions );

        var successCallback = ( ! _.isUndefined( formOptions.onSuccess ) )
            ? formOptions.onSuccess
            : function() { return true; };
            
        var postSuccessCallback = ( ! _.isUndefined( formOptions.postSuccess ) )
            ? formOptions.postSuccess
            : function() { return true; };
            
        var errorCallback = ( ! _.isUndefined( formOptions.onError ) )
            ? formOptions.onError
            : function() { return true; };
            
        var beforeSendCallback = ( ! _.isUndefined( formOptions.beforeSend ) )
            ? formOptions.beforeSend
            : function() { return true; };

        options.beforeSend = function() {
            if ( options.setStatus ) {
                var msg = ( options.statusMessage )
                    ? options.statusMessage
                    : App.Lang.loading;
                App.Message.setStatus( msg, 'request' );
            }
            
            return beforeSendCallback();
        };
        
        options.success = function( response, status, xhr, jqForm ) {
            App.Log.info( 'Completed ajax request with status: ' + App.Util.json_encode( status ) );

            // set up defaults if we didn't get something in the response
            //
            response = ( response ) ? response : {};
            response.status = ( ! _.isUndefined( response.status ) && response.status != null )
                ? response.status
                : App.Const.status_success;
            response.message = ( ! _.isUndefined( response.message ) && response.message != null )
                ? response.message
                : '';

            // process any hooks if there are any
            //
            if ( _.isFunction( self.hook ) ) {
                if ( ! self.hook( response, status, xhr, jqForm ) ) {
                    if ( options.setStatus ) {
                        App.Message.unsetStatus( 'request' );
                    }
                    return false;
                }
            }

            // handle the response
            //
            if ( ! _.isUndefined( response.redirect ) && response.redirect != null && response.redirect.length ) {
                App.Message.setStatus(
                    App.Lang.redirecting, 
                    'request'
                );
                window.location = response.redirect;
                return;
            }
          
            if ( ! _.isUndefined( response.status ) ) {
                if ( response.status == App.Const.status_error ) {
                    if ( ! errorCallback( response, status, xhr, jqForm ) ) {
                        if ( options.setStatus ) {
                            App.Message.unsetStatus( 'request' );
                        }
                        return;
                    }
                    if ( response.message.length ) {
                        App.Message.notify( 
                            response.message, 
                            App.Const.status_error, 
                            false, 
                            options.expire_notification );
                    }
                    else {
                        App.Message.notify( 
                            App.Lang.error_default, 
                            App.Const.status_error, 
                            false, 
                            true );
                    }
                }
                else if ( response.status == App.Const.status_success ) {
                    if ( ! successCallback( response, status, xhr, jqForm ) ) {
                        if ( options.setStatus ) {
                            App.Message.unsetStatus( 'request' );
                        }
                        return;
                    }
                    if ( response.message.length ) {
                        App.Message.notify( 
                            response.message, 
                            App.Const.status_success,
                            false,
                            options.expire_notification );
                    }
                }
                else if ( response.status == App.Const.status_info && response.message.length ) {
                    App.Message.notify( 
                        response.message, 
                        App.Const.status_info,
                        false,
                        options.expire_notification );
                    
                    if ( ! successCallback( response, status, xhr, jqForm ) ) {
                        if ( options.setStatus ) {
                            App.Message.unsetStatus( 'request' );
                        }
                        return;
                    }
                }
            }

            if ( ! _.isUndefined( response.html ) && response.html != null ) {
                // iterate thru each target->content and update the target accordingly
                //
                for ( target in response.html ) {
                    App.Log.debug( "Updating HTML in " + target );

                    try {
                        $( target ).html( response.html[ target ] );
                    }
                    catch ( err ) {
                        if ( options.setStatus ) {
                            App.Message.unsetStatus( 'request' );
                        }
                        App.Log.error( err );
                    }
                }
            }

            if ( ! _.isUndefined( response.script ) && response.script != null && response.script.length ) {
                eval( response.script );
            }

            if ( options.setStatus ) {
                App.Message.unsetStatus( 'request' );
            }
            
            postSuccessCallback( response, status, xhr, jqForm );
        };
        
        if ( _.isUndefined( options.error ) || ! options.error ) {
            options.error = function( qXHR, textStatus, errorThrown ) {
                // check if request was aborted from lack of connectivity. if we're
                // caching failed requests (options.storeLocal) we need to add it 
                // to the local storage and begin polling to resend.
                //
                if ( options.setStatus ) {
                    App.Message.unsetStatus( 'request' );
                }
                
                if ( options.storeLocal ) {
                    if ( App.Request.localStorageEnabled ) {
                        if ( qXHR.status == 0 || qXHR.readyState == 0 ) {
                            // only notify them once that local storage has been enabled
                            //
                            if ( ! App.Request.localStorageNotified ) {
                                App.Request.localStorageNotified = true;
                                App.Message.notify( 
                                    App.Lang.request_local_storage_enabled, 
                                    App.Const.status_info,
                                    false,
                                    options.expire_notification
                                );
                            }
                            
                            // internet is down, request never fired
                            //
                            App.Request.storeRequest( options.url, options.data, options.type );
                            
                            // set the offline status
                            //
                            App.Message.setStatus( App.Lang.request_offline, 'offline', true );
                            
                            return;
                        }
                    }
                    else {
                        if ( qXHR.status == 0 || qXHR.readyState == 0 ) {
                            // we can't save to local storage so let them know that
                            //
                            if ( ! App.Request.localStorageNotified ) {
                                App.Request.localStorageNotified = true;
                                App.Message.notify( 
                                    App.Lang.request_local_storage_disabled, 
                                    App.Const.status_error,
                                    false,
                                    options.expire_notification
                                );
                            }
                            
                            // set the offline status and begin polling for connectivity. If
                            // the connection is re-established then show the appropriate
                            // message.
                            //
                            App.Message.setStatus( App.Lang.request_offline_stay, 'offline', true );
                            _.delay( 
                                function() { App.Request.pingConnection(); }, 
                                App.Const.request_local_wait_ms
                            );
                            
                            return;
                        }
                    }
                }
                
                // handle errors accordingly
                //
                App.Log.error( 
                    'Failed ajax request with status: ' + textStatus + '. Error thrown: ' + 
                    App.Util.json_encode( errorThrown ),
                    {
                        url: options.url,
                        data: options.data,
                        type: options.type,
                        response: qXHR.responseText
                    }
                );
                
                App.Message.notify( 
                    App.Lang.error_request, 
                    App.Const.status_error, 
                    false, 
                    true );
                
                errorCallback();
            };
        }
        
        return options;
    },
    
    // submits a form
    //
    submit: function( form ) {
        var $form = ( _.isString( form ) )
            ? $( form )
            : form;

        $form.submit();
    },
    
    // submit a dynamically created form to the specified URL
    //
    standardSubmit: function( url, data /* , method */ ) {
        var count = $( '.app-js-standard-submit' ).length,
            formId = 'app-js-standard-submit-' + count;
            method = ( arguments.length > 2 )
                ? arguments[ 2 ]
                : 'POST';
        
        $( 'body' ).append( $( '<form/>', {
            id: formId,
            method: method,
            action: url
        }) );
        
        $form = $( '#' + formId );
        
        for ( i in data ) {
            $( '<input>' ).attr({
                type: 'hidden',
                name: i,
                value: data[ i ]
            }).appendTo( $form );
        }

        $form.submit();
    },
    
    // serialize a form to be in object notation for the plugin
    //
    serializeForm: function( form ) {
        var $form = ( _.isString( form ) )
            ? $( form )
            : form;
        var data = $form.serializeArray();
        var ret = {};
        for ( i in data ) {
            ret[ data[ i ].name ] = data[ i ].value;
        };
        
        ret.ajax = true;
        
        return ret;
    },
    
    // performs an ajax POST request
    //
    ajaxPost: function( url, data, callback /*, formOptions */ ) {
        var formOptions = ( arguments.length > 3 )
            ? arguments[ 3 ]
            : {};
            
        this._ajaxCall( url, data, callback, formOptions, 'POST' );
    },
    
    // performs an ajax GET request
    //
    ajaxGet: function( url, data, callback /*, formOptions */ ) {
        var formOptions = ( arguments.length > 3 )
            ? arguments[ 3 ]
            : {};
           
        this._ajaxCall( url, data, callback, formOptions, 'GET' );
    },
    
    // perform an ajax call (internal)
    //
    _ajaxCall: function( url, data, callback, formOptions, method ) {
        formOptions.type = method;
        formOptions.data = data;
        formOptions.postSuccess = callback;

        // if the URL starts with http:// then use it as is, otherwise add the url to
        // the base href and use that as the string
        //
        //var expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
        var expression = /([hH][tT][tT][pP]|[hH][tT][tT][pP][sS]):\/\/(([A-Za-z0-9\.-])+(:[0-9]+)?\.[A-Za-z]{2,5}|((\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(:[0-9]+)?))/;
        var regex = new RegExp( expression );
        //var urlRegex = /^(http:\/\/www.|https:\/\/www.|ftp:\/\/www.|www.){1}([\w]+)(.[\w]+){1,2}$/;

        if ( _.isUndefined( url ) || ! url.length ) {
            App.Log.error( "Attempted ajaxCall on an empty URL" );
            return false;
        }

        if ( url.match( regex ) ) {
            formOptions.url = url;
        }
        else {
            url = ( url.charAt( 0 ) == '/' )
                ? url.substr( 1 )
                : url;
            formOptions.url = App.rootPath + url;
        }

        if ( formOptions.serialized ) {
            formOptions.data.push({ 
                name: 'ajax',
                value: true
            });
        }
        else {
            formOptions.data.ajax = true;
        }

        var options = this.getOptions( formOptions );

        $.ajax( options );
    },
    
    // sends an ajax request to local storage to be submitted when internet
    // connectivity returns. this method only sends the data to the server
    // via ajax. no success or error callbacks are preserved.
    //
    storeRequest: function( url, data /*, method */ ) {
        if ( ! this.localStorageEnabled ) {
            return;
        }
        
        var method = ( arguments.length > 2 )
            ? arguments[ 2 ]
            : 'POST';
            
        var request = {
            url: url,
            data: data,
            method: method
        };
        
        var storedRequests = localStorage.getItem( 'requests' );
        var requestsArray = ( storedRequests )
            ? App.Util.json_decode( storedRequests )
            : [];
        
        requestsArray.push( request );
        
        localStorage.setItem( 'requests', App.Util.json_encode( requestsArray ) );
        
        // if the requests array is new (1 item) send off the pings
        //
        if ( requestsArray.length <= 1 ) {
            _.delay( 
                function() { App.Request.sendStoredRequests(); }, 
                App.Const.request_local_wait_ms
            );
        }
    },
    
    // remove the first stored request (successfully re-sent)
    //
    unstoreRequest: function() {
        if ( ! this.localStorageEnabled ) {
            return;
        }
        
        var storedRequests = localStorage.getItem( 'requests' );
        var requestsArray = ( storedRequests )
            ? App.Util.json_decode( storedRequests )
            : [];
        
        // remove the request from local storage
        //
        if ( requestsArray.length ) {
            requestsArray.shift();
        }
        
        localStorage.setItem( 'requests', App.Util.json_encode( requestsArray ) );
        
        // since this was successful, remove the status message and alert
        // them that they're online again.
        //
        App.Message.unsetStatus( 'offline', true );
        
        if ( this.localStorageNotified ) {
            this.localStorageNotified = false;
            App.Message.notify( 
                App.Lang.request_internet_restored, 
                App.Const.status_success,
                false,
                true
            );
        }
        
        // call again to clear any others
        //
        this.sendStoredRequests();
    },
    
    // if local storage is enabled and if there are requests stored, attempt
    // to submit one of the stored requests. if the request is successful then
    // change the status to online, alert the user, and remove it from the local
    // storage. in both cases check for any more requests.
    // 
    sendStoredRequests: function() {
        if ( ! this.localStorageEnabled ) {
            return;
        }
        
        var storedRequests = localStorage.getItem( 'requests' );
        var requestsArray = ( storedRequests )
            ? App.Util.json_decode( storedRequests )
            : [];
            
        if ( ! requestsArray.length ) {
            return;
        }
        
        // get the first request
        //
        var request = requestsArray[ 0 ];
        
        App.Log.debug( 'Attempting to re-send locally stored request. Stored request count: ' + requestsArray.length );
        
        // send the ajax request. call sendStoredRequests again if it fails.
        // otherwise, unstore the request that succeeds.
        //
        this._ajaxCall(
            request.url,
            request.data,
            function() {
                App.Request.unstoreRequest();
                return false;
            },
            {
                error: function() { 
                    _.delay( 
                        function() { App.Request.sendStoredRequests(); }, 
                        App.Const.request_local_wait_ms
                    );
                    return;
                },
                setStatus: false
            },
            request.method
        );
    },
    
    // send a polling request to see if an internet connection is available.
    // the default ping URL is set in the user constants file.
    //
    pingConnection: function() {
        // send the ajax request
        //
        if ( App.Const.url.request_ping ) {
            this.ajaxPost(
                App.Const.url.request_ping,
                {},
                function() {
                    App.Message.unsetStatus( 'offline', true );
                    App.Message.notify( 
                        App.Lang.request_internet_restored_nolocal, 
                        App.Const.status_success
                    );
                    return false;
                },
                {
                    error: function() {
                        _.delay( 
                            function() { App.Request.pingConnection(); }, 
                            App.Const.request_local_wait_ms
                        );
                    },
                    setStatus: false
                }
            );
        }
    }
    
});




// End of file
