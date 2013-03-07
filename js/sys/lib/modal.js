/**
 * Modal class
 * 
 * Implements various modals used throughout the application.
 */

var ModalClass = Base.extend({

    // page elements
    //
    $eltModal: null,
    $eltModalOverlay: null,
    
    // options
    //
    options: {
        displayOverlay: true,
        htmlSource: null,
        htmlString: null,
        cancelButton: true,
        closeButton: true,
        headerText: null,
        buttons: [],
        sizeClass: null,
        scaleToImage: false,
        maxWidth: 800,
        closeTours: true,
        theme: null,
        callback: null
    },
    
    // add modal selections
    //
    selected: [],
    
    constructor: function() {},
    
    init: function() {
        var self = this;
        
        _.defer( function() {
            // create the modal base element and overlay
            //
            jQuery( '<div/>', {
                'id' : 'aj-modal'
            }).appendTo( 'body' );
            jQuery( '<a/>', {
                'class' : 'aj-close aj-x',
                'href' : 'javascript:;'
            }).appendTo( '#aj-modal' );
            jQuery( '<h1/>', {
                'class' : 'aj-modal-header'
            }).appendTo( '#aj-modal' );
            jQuery( '<div/>', {
                'class' : 'aj-modal-content'
            }).appendTo( '#aj-modal' );
            jQuery( '<div/>', {
                'class' : 'aj-buttons'
            }).appendTo( '#aj-modal' );
            jQuery( '<div/>', {
                id: 'aj-modal-overlay'
            }).appendTo( 'body' );
            
            $( window ).resize( function() {
                self.repositionModal();
            });
            
            self.$eltModal = $( '#aj-modal' );
            self.$eltModalOverlay = $( '#aj-modal-overlay' );
            
            // modal close click handler
            //
            self.$eltModal.delegate( ".aj-close", "click.modal", function() {
                self.close();
                return false;
            });
        });
        
        App.Log.debug( 'Modal library loaded', 'sys' );
    },

    // show the modal to the user. optionally we can specify an HTML DOM element
    // to inject into the modal (detach/attach) and whether or not to display the
    // modal overlay.
    //
    show: function( options ) {
        // if this modal is displayed, ignore for now
        //
        //if ( this.$eltModal.is( ':visible' ) ) {
        //    App.Log.debug( 'Modal already displayed, ignoring request' );
        //    return false;
        //}

        // extend the options if we have anything here
        //
        if ( _.isUndefined( options ) ) {
            options = {};
        }

        options = $.extend( {}, this.options, options );

        // hide any tours that are open
        //
        if ( $( '.aj-tour:visible' ).length && options.closeTours ) {
            App.Tour.close( '.aj-tour:visible' );
        }

        // reset the modal
        //
        this.close( false );

        // display the overlay
        //
        if ( options.displayOverlay ) {
            this.$eltModalOverlay.show().fadeTo( 0, 0.6 );
        }
        
        // set the modal content
        //
        if ( options.htmlSource ) {
            var $source = options.htmlSource.clone( true );
            $source.show();
            this.$eltModal.find( '.aj-modal-content' ).html( $source );
        }
        
        if ( options.htmlString ) {
            this.$eltModal.find( '.aj-modal-content' ).html( options.htmlString );
        }
        
        if ( options.headerText ) {
            this.$eltModal.find( 'h1.aj-modal-header' ).html( options.headerText ).show();
        }
        else {
            this.$eltModal.find( 'h1.aj-modal-header' ).html( '' ).hide();
        }
        
        // set the buttons
        //
        if ( options.cancelButton ) {
            jQuery( '<a/>', {
                'class' : 'aj-close aj-button left red',
                'href' : 'javascript:;',
                'text' : App.Lang.cancel
            }).appendTo( this.$eltModal.find( '.aj-buttons' ) );
        }
        
        if ( options.closeButton ) {
            this.$eltModal.find( '.aj-close.aj-x' ).show();
        }
        else {
            this.$eltModal.find( '.aj-close.aj-x' ).hide();
        }
        
        var self = this;
        
        if ( options.buttons.length ) {
            for ( var i = 0; i < options.buttons.length; i++ ) {
                var button = options.buttons[ i ];
                
                jQuery( '<a/>', {
                    'class' : 'aj-button aj-button-callback',
                    'href' : 'javascript:;',
                    'text' : button.text,
                    'id' : 'aj-modal-button-' + i
                }).appendTo( this.$eltModal.find( '.aj-buttons' ) );
                
                $( "#aj-modal-button-" + i ).click( function() {
                    if ( button.callback() ) {
                        self.close();
                        return false;
                    }
                });
            }
        }

        if ( this.$eltModal.find( '.aj-buttons .aj-button' ).length ) {
            this.$eltModal.find( '.aj-buttons' ).show();
        }
        else {
            this.$eltModal.find( '.aj-buttons' ).hide();
        }
        
        // check if we want to re-size based on image width
        //
        if ( options.scaleToImage ) {
            var $img = $( '.aj-modal-content img' );
            
            $img.removeAttr( 'height width' );

            var width = $img.get( 0 ).width,
                height = $img.get( 0 ).height;

            if ( width > options.maxWidth ) {
                width = options.maxWidth;
            }

            this.$eltModal.width( width );
            $( '.aj-modal-content img' )
                .width( width )
                .height( height );
        }

        // check if we're using a theme
        //
        this.$eltModal.removeClass();

        if ( options.theme ) {
            this.$eltModal.addClass( options.theme );
        }
        else if ( App.Config.modal_theme ) {
            this.$eltModal.addClass( 
                App.Config.modal_theme );
        }

        // check for the size class
        //
        if ( options.sizeClass ) {
            this.$eltModal.addClass( options.sizeClass );
        }

        // check if we have a callback after the modal is rendered
        //
        if ( options.callback && _.isFunction( options.callback ) ) {
            options.callback();
        }

        // resize and reposition the modal
        //
        var self = this;
        this.repositionModal( true, options.callback );

        Mousetrap.bind( [ 'escape' ], function(e) {
            if ( self.$eltModal.is( ':visible' ) ) {
                App.Modal.close();
            }

            return false;
        });
    },
    
    // pull the content via ajax call and use that as the source
    // signature:
    //     url
    //     url, callback
    //     url, data
    //     url, callback, data
    //
    ajaxShow: function( url /*, callback, data, options */ ) {
        // make a request for the content and pass it into the show method
        //
        var self = this,
            callback = function() { return true; },
            data = {},
            options = {};
        
        // callback is optional, so if its a function set arg 2 to be the
        // callback, if not set it to be the data
        //
        if ( arguments.length > 1 ) {
            if ( _.isFunction( arguments[ 1 ] ) ) {
                callback = arguments[ 1 ];
            }
            else {
                data = arguments[ 1 ];
            }
        }
        
        // if we have exactly 3 arguments, the third argument is either 
        // data or options depending on arg 2
        //
        if ( arguments.length == 3 ) {
            if ( _.isFunction( arguments[ 1 ] ) ) {
                data = arguments[ 2 ];
            }
            else {
                options = arguments[ 2 ];
            }
        }
        
        if ( arguments.length == 4 ) {
            data = arguments[ 2 ];
            options = arguments[ 3 ];
        }

        App.Request.ajaxPost(
            url,
            data,
            function( response ) {
                if ( response.status != App.Const.status_error ) {
                    options = $.extend( 
                        {}, 
                        {
                            htmlString: response.data.html,
                            headerText: response.data.header
                        }, 
                        options
                    );
                    self.show( options );
                    callback( response );
                }
            }
        );
    },
    
    // adds a button with a callback to the modal
    //
    addButton: function( text, callback ) {
        text = text || App.Lang.submit;
        this.options.buttons.push({
            text: text,
            callback: callback
        });
    },

    // update the callback button
    //
    updateButton: function( text, callback ) {
        var $button = this.$eltModal.find( '.aj-button-callback' ).first();

        $button.off( 'click' );
        $button.html( text ).click( callback );
    },
     
    close: function( /* clickEvent = true */ ) {
        clickEvent = ( arguments.length > 0 )
            ? arguments[ 0 ]
            : true;
        
        // close modal window
        //
        if ( clickEvent ) {
            App.Log.debug( "Closing modal window" );

            this.$eltModalOverlay.hide();
            this.$eltModal.hide();
        }

        this.$eltModal.attr( 'class', '' );
        this.$eltModal.removeAttr( 'style' );
        
        // clear the modal content
        //
        this.$eltModal.find( 'h1.aj-modal-header' ).html( '' );
        
        if ( clickEvent ) {
            this.$eltModal.find( '.aj-modal-content' ).html( '' );
        }
        
        this.$eltModal.find( '.aj-modal-content' ).css({
            'height' : 'auto'
        });
        
        // clear the buttons and other variables
        //
        this.options.buttons = [];
        this.$eltModal.find( '.aj-buttons' ).html( '' );
        this.selected = [];

        Mousetrap.unbind( [ 'escape' ] );
    },
    
    repositionModal: function( /* show, callback */ ) {
        var show = ( arguments.length > 0 )
            ? arguments[ 0 ]
            : false;
        var callback = ( arguments.length > 1 )
            ? arguments[ 1 ]
            : null;
            
        if ( show ) {
            this.$eltModal.show();
        }

        this.$eltModal.find( '.aj-modal-content' ).css({
            'height' : 'auto'
        });

        // the modal height needs to be aware of the screen height. we can display
        // the modal up until it hits a specified padding inside the window.
        // once the height is too tall for the window, we need to set an overflow
        // scroll to the content area.
        //
        // first we need to adjust for retina displays reporting incorrect resolutions though.
        // e.g., iPad 3 shows 1024x768 still but uses "2" for its pixel ratio to account.
        //
        var ratio = 1; // (! ( window ).devicePixelRatio) ? 1 : ( window ).devicePixelRatio;
                       // disabling for now
        var height = this.$eltModal.outerHeight() * ratio,
            windowHeight = $( window ).height() * ratio,
            contentHeight = this.$eltModal.find( '.aj-modal-content' ).outerHeight() * ratio,
            width = this.$eltModal.outerWidth() * ratio,
            windowWidth = $( window ).width() * ratio;
            
        if ( height > windowHeight - 20 ) {
            var fixedHeight = height - contentHeight,
                newHeight = windowHeight - 20;
            var newContentHeight = newHeight - fixedHeight;
            
            this.$eltModal.find( '.aj-modal-content' ).css({
                'height' : newContentHeight
            });
            
            height = newHeight;
        }
        else {
            this.$eltModal.find( '.aj-modal-content' ).css({
                'height' : 'auto'
            });
        }

        this.$eltModal.css({ 
            'top' : ( windowHeight / 2 ) - ( height / 2 ), 
            'left' : ( windowWidth / 2 ) - ( width / 2 ) 
        });

        if ( _.isFunction( callback ) ) {
            callback();
        }
    },

    resize: function ( width ) {
        this.$eltModal.css({
            'width' : width
        });

        this.repositionModal();
    },
    
    destroy: function() {
        // undelegate namespace event handlers
        //
        this.$eltModal.undelegate( '.modal' );
    }

});




// End of file
