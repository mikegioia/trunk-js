/**
 * Messaging class
 * 
 * Contains all of the alerting, messaging, and notifying used throughout the app.
 */

var MessageClass = Base.extend({
    
    // elements
    //
    $eltWorking: null,
    $eltWorkingOverlay: null,
    $eltStatus: null,
    $eltNotifications: null,
    $eltAlert: null,
    $eltAlertOverlay: null,
    $eltConfirm: null,
    $eltConfirmOverlay: null,
    $eltPrompt: null,
    $eltPromptOverlay: null,

    // message stacks
    //
    stack: [],
    alertStack: [],
    confirmStack: [],
    
    // list of keys to preserve until removed
    //
    preservedKeys: [],
    
    constructor: function() {},
    
    init: function() {
        var self = this;
        
        // create the working element (this exists outside of the defer)
        //
        if ( ! $( '#aj-working' ).length ) {
            jQuery( '<div/>', {
                id: 'aj-working'
            }).appendTo( 'body' );
            jQuery( '<span/>' ).appendTo( '#aj-working' );
            jQuery( '<div/>', {
                id: 'aj-working-overlay'
            }).appendTo( 'body' );
        }

        this.$eltWorking = $( '#aj-working' );
        this.$eltWorkingOverlay = $( '#aj-working-overlay' );
        
        _.defer( function() {
            // create the status element
            //
            jQuery( '<div/>', {
                id: 'aj-status'
            }).appendTo( 'body' );
            jQuery( '<span/>' ).appendTo( '#aj-status' );

            self.$eltStatus = $( '#aj-status' );
            
            // create the notifications container and position it according to config
            //
            jQuery( '<div/>', {
                id: 'aj-notifications'
            }).appendTo( 'body' );
            
            self.$eltNotifications = $( '#aj-notifications' );

            // create the alert element and overlay
            //
            jQuery( '<div/>', {
                id: 'aj-alert'
            }).appendTo( 'body' );
            jQuery( '<p/>' ).appendTo( '#aj-alert' );
            jQuery( '<div/>', {
                'class' : 'aj-buttons'
            }).appendTo( '#aj-alert' );
            jQuery( '<a/>', {
                'class' : 'aj-close aj-button',
                'href' : 'javascript:;'
            }).appendTo( '#aj-alert .aj-buttons' );
            jQuery( '<div/>', {
                id: 'aj-alert-overlay'
            }).appendTo( 'body' );

            self.$eltAlert = $( '#aj-alert' );
            self.$eltAlertOverlay = $( '#aj-alert-overlay' );
            
            $( window ).resize( function() {
                self.repositionAlert();
            });
            
            // create the confirm element and overlay
            //
            jQuery( '<div/>', {
                id: 'aj-confirm'
            }).appendTo( 'body' );
            jQuery( '<p/>' ).appendTo( '#aj-confirm' );
            jQuery( '<div/>', {
                'class' : 'aj-buttons'
            }).appendTo( '#aj-confirm' );
            jQuery( '<a/>', {
                'class' : 'aj-confirm-cancel red aj-button',
                'href' : 'javascript:;'
            }).appendTo( '#aj-confirm .aj-buttons' );
            jQuery( '<a/>', {
                'class' : 'aj-confirm-ok aj-button',
                'href' : 'javascript:;'
            }).appendTo( '#aj-confirm .aj-buttons' );
            jQuery( '<div/>', {
                id: 'aj-confirm-overlay'
            }).appendTo( 'body' );

            self.$eltConfirm = $( '#aj-confirm' );
            self.$eltConfirmOverlay = $( '#aj-confirm-overlay' );

            // create the prompt element and overlay
            //
            jQuery( '<div/>', {
                id: 'aj-prompt'
            }).appendTo( 'body' );
            jQuery( '<h1/>' ).appendTo( '#aj-prompt' );
            jQuery( '<p/>' ).appendTo( '#aj-prompt' );
            jQuery( '<input/>', {
                'type' : 'text',
                'name' : 'user_input',
                'value' : '',
                'class' : 'aj-user-input'
            }).appendTo( '#aj-prompt' );
            jQuery( '<div/>', {
                'class' : 'aj-buttons'
            }).appendTo( '#aj-prompt' );
            jQuery( '<a/>', {
                'class' : 'aj-prompt-cancel red aj-button',
                'href' : 'javascript:;'
            }).appendTo( '#aj-prompt .aj-buttons' );
            jQuery( '<a/>', {
                'class' : 'aj-prompt-ok aj-button',
                'href' : 'javascript:;'
            }).appendTo( '#aj-prompt .aj-buttons' );
            jQuery( '<div/>', {
                id: 'aj-prompt-overlay'
            }).appendTo( 'body' );

            self.$eltPrompt = $( '#aj-prompt' );
            self.$eltPromptOverlay = $( '#aj-prompt-overlay' );

            // user input click handler (submit)
            //
             self.$eltPrompt.find( '.aj-user-input' ).on( 'keydown', function( e ) {
                if ( e.keyCode == App.Const.key_enter ) {
                     self.$eltPrompt.find( '.aj-buttons .aj-prompt-ok' ).click();
                }
            });
            
            // notification location
            //
            if ( App.Config.message_notif_location == 'top' ) {
                self.$eltNotifications.addClass( 'top' );
            }
            else {
                self.$eltNotifications.addClass( 'bottom' );
            }

            // notification close click handler
            //
            self.$eltNotifications.delegate( ".aj-close", "click.message", function() {
                self.closeNotify( $( this ), self );
            });
            
            // alert close click handler
            //
            self.$eltAlert.delegate( ".aj-close", "click.message", function() {
                self.closeAlert( $( this ) );
            });
            
            // confirm close click handler
            //
            self.$eltConfirm.delegate( ".aj-close", "click.message", function() {
                self.closeConfirm( $( this ) );
            });
        });
        
        App.Log.debug( 'Message library loaded', 'sys' );
    },
    
    destroy: function() {
        // undelegate namespace event handlers
        //
        this.$eltNotifications.undelegate( 'message' );
        this.$eltAlert.undelegate( 'message' );
        this.$eltConfirm.undelegate( 'message' );
    },
    
    // show an alert to the user
    //
    alert: function( msg /*, displayOverlay */ ) {
        // if this alert is displayed, queue this one
        //
        if ( this.$eltAlert.is( ':visible' ) ) {
            App.Log.debug( 'Alert message already displayed, pushing message to alert stack' );
            
            this.alertStack.push({ 
                'msg' : msg,
                'displayOverlay' : displayOverlay
            });
            
            return false;
        }
        
        // display the overlay
        //
        var displayOverlay = ( arguments.length > 1 )
            ? arguments[ 1 ]
            : true;
            
        if ( displayOverlay ) {
            this.$eltAlertOverlay.show().fadeTo( 0, 0.6 );
        }
        
        // set the alert content
        //
        msg = msg || App.Lang.error_default;
        this.$eltAlert.find( 'p' ).html( msg );
        this.$eltAlert.find( '.aj-buttons a' ).html( App.Lang.ok );
        
        this.repositionAlert( true );
    },
    
    closeAlert: function() {
        App.Log.debug( "Closing alert window" );
        
        // close alert window
        //
        this.$eltAlert.find( 'p' ).html( '' );
        this.$eltAlertOverlay.hide();
        this.$eltAlert.hide();
        
        // check the alert stack for any other messages
        //
        if ( this.alertStack.length ) {
            var alert = this.alertStack.shift();
            this.alert( alert.msg, alert.displayOverlay );
        }
    },
    
    repositionAlert: function( /* show */ ) {
        var show = ( arguments.length > 0 )
            ? arguments[ 0 ]
            : false;
            
        if ( show ) {
            this.$eltAlert.show();
        }
        
        var height = this.$eltAlert.outerHeight(),
            windowHeight = $( window ).height(),
            width = this.$eltAlert.outerWidth(),
            windowWidth = $( window ).width();
            
        this.$eltAlert.css({
            'top' : ( windowHeight / 2 ) - ( height / 2 ),
            'left' : ( windowWidth / 2 ) - ( width / 2 ) 
        });
    },
    
    // create a confirm dialog
    //
    confirm: function( msg /*, okay, cancel, displayOverlay | params */ ) {
        // if this alert is displayed, queue this one
        //
        if ( this.$eltConfirm.is( ':visible' ) ) {
            App.Log.debug( 'Confirm dialog already displayed, pushing message to confirm stack' );
            
            this.confirmStack.push({ 
                'msg' : msg,
                'displayOverlay' : displayOverlay
            });
            
            return false;
        }
        
        // display the overlay
        //
        var params = ( arguments.length > 3 )
            ? arguments[ 3 ]
            : {};

        if ( _.isBoolean( params ) ) {
            params = {
                displayOverlay: ( params ? params : true )
            };
        }

        if ( _.isUndefined( params.displayOverlay ) ) {
            params.displayOverlay = true;
        }

        if ( params.displayOverlay ) {
            this.$eltConfirmOverlay.show().fadeTo( 0, 0.6 );
        }
        
        // set up the callbacks
        //
        var okay = ( arguments.length > 1 )
            ? arguments[ 1 ]
            : function() { return; };
        var cancel = ( arguments.length > 2 )
            ? arguments[ 2 ]
            : function() { return; };
        
        // set the confirm content
        //
        this.$eltConfirm.find( 'p' ).html( msg );
        this.$eltConfirm.find( '.aj-confirm-ok' ).html( 
            ( _.isUndefined( params.ok_text ) )
                ? App.Lang.ok
                : params.ok_text );
        this.$eltConfirm.find( '.aj-confirm-cancel' ).html( App.Lang.cancel );
        
        // confirm dialog button callbacks
        //
        var self = this;
        
        this.$eltConfirm.on( "click.message", ".aj-confirm-ok", function() {
            self.closeConfirm();
            okay();
        });
        
        this.$eltConfirm.on( "click.message", ".aj-confirm-cancel", function() {
            self.closeConfirm();
            cancel();
        });
        
        this.repositionConfirm( true );
    },
    
    closeConfirm: function() {
        App.Log.debug( "Closing confirm window" );
        
        // close confirm window
        //
        this.$eltConfirm.find( 'p' ).html( '' );
        this.$eltConfirmOverlay.hide();
        this.$eltConfirm.hide();
        this.$eltConfirm.off( "click.message", ".aj-confirm-ok" );
        this.$eltConfirm.off( "click.message", ".aj-confirm-cancel" );
        
        // check the alert stack for any other messages
        //
        if ( this.confirmStack.length ) {
            var confirm = this.confirmStack.shift();
            this.confirm( confirm.msg, confirm.displayOverlay );
        }
    },
    
    repositionConfirm: function( /* show */ ) {
        var show = ( arguments.length > 0 )
            ? arguments[ 0 ]
            : false;
            
        if ( show ) {
            this.$eltConfirm.show();
        }
        
        var height = this.$eltConfirm.outerHeight(),
            windowHeight = $( window ).height(),
            width = this.$eltConfirm.outerWidth(),
            windowWidth = $( window ).width();
            
        this.$eltConfirm.css({ 
            'top' : ( windowHeight / 2 ) - ( height / 2 ),
            'left' : ( windowWidth / 2 ) - ( width / 2 ) 
        });
    },

    // create a prompt dialog
    //
    prompt: function( msg /*, okay, cancel, displayOverlay | params */ ) {
        // if this prompt is displayed, do nothing
        //
        if ( this.$eltPrompt.is( ':visible' ) ) {
            return false;
        }
        
        // display the overlay
        //
        var params = ( arguments.length > 3 )
            ? arguments[ 3 ]
            : {};

        if ( _.isBoolean( params ) ) {
            params = {
                displayOverlay: ( params ? params : true )
            };
        }

        if ( _.isUndefined( params.displayOverlay ) ) {
            params.displayOverlay = true;
        }

        if ( params.displayOverlay ) {
            this.$eltPromptOverlay.show().fadeTo( 0, 0.6 );
        }

        if ( _.has( params, 'title' ) ) {
            this.$eltPrompt.find( 'h1' ).html( params.title ).show();
        }
        else {
            this.$eltPrompt.find( 'h1' ).hide();
        }
        
        // set up the callbacks
        //
        var okay = ( arguments.length > 1 )
            ? arguments[ 1 ]
            : function() { return; };
        var cancel = ( arguments.length > 2 )
            ? arguments[ 2 ]
            : function() { return; };
        
        // set the prompt content
        //
        this.$eltPrompt.find( 'p' ).html( msg );
        this.$eltPrompt.find( '.aj-prompt-ok' ).html( 
            ( _.isUndefined( params.ok_text ) )
                ? App.Lang.ok
                : params.ok_text );
        this.$eltPrompt.find( '.aj-prompt-cancel' ).html( App.Lang.cancel );
        
        // prompt dialog button callbacks
        //
        var self = this;
        
        this.$eltPrompt.on( "click.message", ".aj-prompt-ok", function( e ) {
            var userValue = $( this ).closest( '#aj-prompt' ).find( 'input.aj-user-input' ).val();

            if ( ! $.trim( userValue ).length ) {
                App.Message.notify(
                    App.Lang.error_no_prompt_value );
            }
            else {
                self.closePrompt( $( this ) );
                okay( userValue );
            }

            if ( _.has( params, 'stopPropagation' ) ) {
                e.stopPropagation();
                return false;
            }
        });
        
        this.$eltPrompt.on( "click.message", ".aj-prompt-cancel", function( e ) {
            self.closePrompt( $( this ) );
            cancel();

            if ( _.has( params, 'stopPropagation' ) ) {
                e.stopPropagation();
                return false;
            }
        });
        
        this.repositionPrompt( true );
    },
    
    closePrompt: function() {
        App.Log.debug( "Closing prompt window" );

        // close confirm window
        //
        this.$eltPrompt.find( 'p' ).html( '' );
        this.$eltPrompt.find( 'h1' ).html( '' );
        this.$eltPrompt.find( 'input.aj-user-input' ).val( '' );
        this.$eltPromptOverlay.hide();
        this.$eltPrompt.hide();
        this.$eltPrompt.off( "click.message", ".aj-prompt-ok" );
        this.$eltPrompt.off( "click.message", ".aj-prompt-cancel" );
    },
    
    repositionPrompt: function( /* show */ ) {
        var show = ( arguments.length > 0 )
            ? arguments[ 0 ]
            : false;
            
        if ( show ) {
            this.$eltPrompt.show();
            this.$eltPrompt.find( 'input.aj-user-input' ).focus();
        }
        
        var height = this.$eltPrompt.outerHeight(),
            windowHeight = $( window ).height(),
            width = this.$eltPrompt.outerWidth(),
            windowWidth = $( window ).width();
            
        this.$eltPrompt.css({ 
            'top' : ( windowHeight / 2 ) - ( height / 2 ),
            'left' : ( windowWidth / 2 ) - ( width / 2 ) 
        });
    },
    
    // display growl-type notification to the user
    //
    notify: function( /* msg, type, decode || options, expire, allowClose */ ) {
        var msg = ( arguments.length > 0 )
            ? arguments[ 0 ]
            : App.Lang.error_default;
        var type = ( arguments.length > 1 )
            ? arguments[ 1 ]
            : App.Const.status_error;
        var defaults = {
            decode: false,
            expire: null,
            allowClose: true,
            key: ''
        };

        if ( arguments.length > 2 && _.isObject( arguments[ 2 ] ) ) {
            var options = _.extend( {}, defaults, arguments[ 2 ] );
        }
        else {
            var decode = ( arguments.length > 2 )
                ? arguments[ 2 ]
                : false
            var expire = ( arguments.length > 3 )
                ? arguments[ 3 ]
                : null
            var allowClose = ( arguments.length > 4 )
                ? arguments[ 4 ]
                : true;
            var options = {
                decode: decode,
                expire: expire,
                allowClose: allowClose
            };
            options = _.extend( {}, defaults, options );
        }

        if ( options.decode == true ) {
            msg = App.Util.urldecode( msg );
        }

        // check if a key came in. if so, we don't want to display another message with
        // the same key (if one is currently open).
        //
        if ( options.key.length ) {
            if ( $( '.aj-notif.aj-key-' + options.key + ':visible' ).length ) {
                App.Log.info( 
                    'Not creating new notification. Key:' + options.key + ' already exists.' );
                return false;
            }
        }
        
        App.Log.info( 'Creating new notification with type: ' + type + ', and message: ' + msg );
        
        var msgCount = this.$eltNotifications.find( '.aj-notif' ).length;
        var msgId = 'aj-notif-' + ( msgCount + 1 );

        // create a new notification
        //
        if ( App.Config.message_notif_location == 'top' ) {
            jQuery( '<div/>', {
                'id': msgId,
                'style': 'display:none;',
                'class': 'aj-notif aj-key-' + options.key + ' aj-status-' + type
            }).prependTo( this.$eltNotifications );

            if ( options.allowClose ) {
                jQuery( '<a/>', {
                    'class': 'aj-close',
                    'href' : 'javascript:;'
                }).prependTo( '#' + msgId );
            }

            jQuery( '<span/>', {
                'class': 'aj-message'
            }).prependTo( '#' + msgId );
        }
        else {
            jQuery( '<div/>', {
                'id': msgId,
                'style': 'display:none;',
                'class': 'aj-notif aj-status-' + type
            }).appendTo( this.$eltNotifications );

            if ( options.allowClose ) {
                jQuery( '<a/>', {
                    'class': 'aj-close',
                    'href' : 'javascript:;'
                }).appendTo( '#' + msgId );
            }

            jQuery( '<span/>', {
                'class': 'aj-message'
            }).appendTo( '#' + msgId );
        }
        
        $( '#' + msgId ).find( 'span' ).html( msg );
        
        if ( App.Config.message_notif_animate ) {
            $( '#' + msgId ).fadeIn();
        }
        else {
            $( '#' + msgId ).show();
        }
        
        if ( options.expire === true || ( options.expire === null && App.Config.message_expire ) ) {
            if ( App.Config.message_notif_animate ) {
                var t = setTimeout( "$('#" + msgId + "').fadeOut()", App.Config.message_expire_length );
            }
            else {
                var t = setTimeout( "$('#" + msgId + "').remove()", App.Config.message_expire_length );
            }
        }
    },
    
    closeNotify: function( $obj ) {
        if ( ! $obj || ! $obj.length ) {
            return false;
        }

        App.Log.debug( "Closing message notification: " + $obj.parent().attr( 'id' ) );
        
        // close notifcation and reassign IDs
        //
        $obj.parent().remove();

        var msgCount = this.$eltNotifications.find( '.aj-notif' ).length;
        var count = 1;

        this.$eltNotifications.find( '.aj-notif' ).each( function() {
            $( this ).attr( 'id', 'aj-notif-' + count );
            count++;
        });
    },

    getNotifyCount: function() {
        return this
            .$eltNotifications
            .find( '.aj-notif:visible' )
            .length;
    },

    closeAllNotify: function() {
        App.Log.debug( "Closing all message notification" );
        
        this.$eltNotifications.find( '.aj-notif' ).each( function() {
            $( this ).remove();
        });
    },
    
    // set the global status
    //
    setStatus: function( /* msg, key, preserve */ ) {
        var msg = ( ! arguments.length )
            ? App.Lang.loading
            : arguments[ 0 ];
            
        var key = ( arguments.length > 1 )
            ? arguments[ 1 ]
            : null;
        
        var preserve = ( arguments.length > 2 )
            ? arguments[ 2 ]
            : false;
        
        App.Log.debug( "Setting status: " + msg + ", with key: " + key );
        
        if ( preserve ) {
            App.Log.debug( "Preserving status" );
            
            if ( ! App.Util.in_array( key, this.preservedKeys ) ) {
                this.preservedKeys.push( key );
            }
            else {
                return;
            }
        }
        
        if ( key ) {
            var obj = {};
            obj[ key ] = msg;
            this.stack.push( obj );
        }
        else {
            this.stack.push( msg );
        }
        
        this.$eltStatus.find( 'span' ).html( msg );
        
        // reposition the status message
        //
        var width = this.$eltStatus.outerWidth(),
            windowWidth = $( window ).width();
        this.$eltStatus.css( 'left', ( windowWidth / 2 ) - ( width / 2 ) );
        this.$eltStatus.show();
    },
    
    // unset the global status
    //
    unsetStatus: function( /* key, preserve */ ) {
        var key = ( arguments.length )
            ? arguments[ 0 ]
            : null;
        
        var preserve = ( arguments.length > 1 )
            ? arguments[ 1 ]
            : false;
        
        App.Log.debug( "Un-setting status with key: " + key );

        // if we're removing a preserved key, bounce out of here if the
        // requested key is not in the preserved list
        //
        if ( preserve ) {
            App.Log.debug( "Explicitly removing preserved key" );
            
            if ( ! App.Util.in_array( key, this.preservedKeys ) ) {
                return;
            }
        }

        // if we have a key, search and remove that. if we don't have a key, 
        // try to remove an element with no key set. if no key is found or if 
        // the array size is 1, pop the array.
        //
        var found = false;
        var currentMessage = this.$eltStatus.find( 'span' ).html();
        var poppedElement = null;
        
        if ( key ) {
            // check for the key, if we find it then remove it
            //
            for ( i in this.stack ) {
                if ( this.stack[ i ][ key ] ) {
                    found = true;
                    this.stack.splice( i, 1 );
                    break;
                }
            }
        }
        else {
            // try to remove a non-keyed element
            //
            for ( i in this.stack ) {
                if ( typeof this.stack[ i ] != 'object' ) {
                    found = true;
                    this.stack.splice( i, 1 );
                    break;
                }
            }
        }

        // if nothing was found, remove an item that's not in the preserved
        // keys list
        //
        if ( ! found ) {
            for ( i in this.stack ) {
                // if it's just a string, get it out of there. otherwise check
                // if the key is in the preserved list. if it's not remove it.
                //
                if ( _.isString( this.stack[ i ] ) ) {
                    this.stack.splice( i, 1 );
                    break;
                }
                else {
                    var keys = _.keys( this.stack[ i ] );
                    if ( ! _.intersection( keys, this.preservedKeys ) ) {
                        this.stack.splice( i, 1 );
                        break;
                    }
                }
            }
        }

        // if the key was preserved, remove it from the list
        //
        if ( App.Util.in_array( key, this.preservedKeys ) ) {
            this.preservedKeys = _.without( this.preservedKeys, key );
        }

        // finally, if the stack is still full set the element status to the last
        // message. otherwise hide it.
        //
        if ( ! this.stack.length ) {
            this.$eltStatus.hide();
        }
        else {
            var newMessage = "",
                lastElement = _.last( this.stack );
            if ( typeof lastElement == 'object' ) {
                for ( i in lastElement ) {
                    newMessage = lastElement[ i ];
                    break;
                }
            }
            else {
                newMessage = lastElement;
            }
            
            this.$eltStatus.find( 'span' ).html( newMessage );
        }
    },
    
    // loads the global working dialog to prevent action on the page
    //
    setWorking: function( msg ) {
        // display the overlay
        //
        this.$eltWorkingOverlay.show().fadeTo( 0, 0.8 );
        
        // set the working content
        //
        msg = msg || App.Lang.working;
        this.$eltWorking.find( 'span' ).html( msg );
        
        this.repositionWorking( true );
    },
    
    // removes the working dialog
    //
    unsetWorking: function() {
        this.$eltWorkingOverlay.hide();
        this.$eltWorking.hide();
        this.$eltWorking.find( 'span' ).html( '' );
    },
    
    // set the working dialog in the center of the page
    //
    repositionWorking: function( /* show */ ) {
        var show = ( arguments.length > 0 )
            ? arguments[ 0 ]
            : false;
            
        if ( show ) {
            this.$eltWorking.show();
        }
        
        var height = this.$eltWorking.outerHeight(),
            windowHeight = $( window ).height(),
            width = this.$eltWorking.outerWidth(),
            windowWidth = $( window ).width();
            
        this.$eltWorking.css({ 
            'top' : ( windowHeight / 2 ) - ( height / 2 ),
            'left' : ( windowWidth / 2 ) - ( width / 2 )
        });
    }
    
});




// End of file