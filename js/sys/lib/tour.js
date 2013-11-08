/**
 * Tour class
 * 
 * Creates and displays a page-wide tour modal. Tour location options 
 * can take any of the following strings:
 *   topleft
 *   topright
 *   bottomleft
 *   bottomright
 */

var TourClass = Base.extend({
    
    // elements
    //
    $eltTour: null,
    $eltTourOverlay: null,
    
    // options
    //
    defaults: {
        displayOverlay: false,
        location: 'bottomleft',
        opacity: 0.6,
        returnTop: true,
        onComplete: false,
        width: 400,
        expose: false,
        color: '#000',
        disableButtons: false,
        scrollPad: 0,
        topPad: 0,
        leftPad: 0,
        highlight: false
    },
    
    locations: [
        'topleft',
        'topright',
        'bottomleft',
        'bottomright'
    ],
    
    // add modal selections
    //
    selected: [],
    
    constructor: function() {},
    
    init: function() {
        var self = this;
        
        _.defer( function() {
            // create the overlay and tour elements
            //
            jQuery( '<div/>', {
                id: 'aj-tour-overlay'
            }).appendTo( 'body' );

            self.$eltTourOverlay = $( '#aj-tour-overlay' );
            self.$eltTourOverlay.hide();
        });
        
        App.Log.debug( 'Tour library loaded', 'sys' );
    },
    
    // reads in a selector element and creates the necessary 
    //
    start: function( selector /*, options */ ) {
        // close any open tours
        //
        if ( $( '.aj-tour:visible' ).length ) {
            this.close( '.aj-tour:visible' );
        }

        // check if selector is a string or object 
        //
        var $tour = ( _.isString( selector ) ) 
            ? $( selector )
            : selector,
            self = this;
        
        if ( ! $tour || ! $tour.length || $tour.length > 1 ) {
            App.Log.warn( 'Attempted to start tour on a collection: ' + selector + ' of size: ' + $tour.length );
            return;
        }
        
        var options = ( arguments.length > 1 )
            ? arguments[ 1 ]
            : {};
        options = $.extend( {}, this.defaults, options );

        // check the tour DOM object for any data-options
        //
        var tourData = $tour.data();

        if ( _.has( tourData, 'disablebuttons' ) ) {
            options.disableButtons = tourData.disablebuttons;
        }

        if ( _.has( tourData, 'returntop' ) ) {
            options.returnTop = tourData.returntop;
        }

        if ( _.has( tourData, 'displayoverlay' ) ) {
            options.displayOverlay = tourData.displayoverlay;
        }

        // if the guide isn't hidden, hide it now. enable the options.
        //
        $tour.hide();
        $tour.css( 'width', options.width );
        $tour.removeClass( this.locations.join( ' ' ) );
        $tour.addClass( options.location );
        
        // loop through the guide wrapper and set up each content div.
        // their data-target attribute should point to the element on the page
        // they would like to target, and their data-location attribute should
        // be the location code for the tooltip. if none is set then the
        // default settings option is used.
        //
        var count = 0;
        $tour.find( 'div' ).each( function() {
            count++;
            var $this = $( this );
            $this.hide();
            $this.data( 'properties', {
                target: ( $this.data( 'target' ) ) ? $this.data( 'target' ) : null,
                beforeRender: ( $this.data( 'beforerender' ) ) ? $this.data( 'beforerender' ) : null,
                location: ( $this.data( 'location' ) ) ? $this.data( 'location' ) : options.location,
                scrollPad: ( $this.data( 'scrollpad' ) ) ? $this.data( 'scrollpad' ) : options.scrollPad,
                topPad: ( $this.data( 'toppad' ) ) ? $this.data( 'toppad' ) : options.topPad,
                leftPad: ( $this.data( 'leftpad' ) ) ? $this.data( 'leftpad' ) : options.leftPad,
                cssPosition: ( $this.data( 'cssposition' ) ) ? $this.data( 'cssposition' ) : 'absolute',
                spotlight: ( $this.data( 'spotlight' ) ) ? $this.data( 'spotlight' ) : false,
                displayOverlay: ( $this.data( 'displayoverlay' ) !== null ) ? $this.data( 'displayoverlay' ) : null,
                highlight: ( $this.data( 'highlight' ) !== null ) ? $this.data( 'highlight' ) : options.highlight
            });
        });

        $tour.data( 'count', count );
        $tour.data( 'index', 1 );
        $tour.data( 'options', options );
       
        // show the overlay if it's set
        //
        if ( options.displayOverlay === true ) {
            this.$eltTourOverlay.fadeTo( 0, options.opacity );
            this.$eltTourOverlay.show();
        }
        else {
            this.$eltTourOverlay.hide();
        }
        
        // create the cancel button and the finished button
        //
        $tour.find( '.aj-button, .aj-x' ).remove();
        
        var $doneButton = jQuery( '<a/>', {
            'class' : 'aj-button aj-button-done blue',
            'text': App.Lang.done_exclame,
            'href' : 'javascript:;'
        }).appendTo( $tour );
        var $cancelButton = jQuery( '<a/>', {
            'class' : 'aj-x',
            'text': '',
            'href' : 'javascript:;'
        }).appendTo( $tour );
        
        $doneButton.click( function() {
            App.Tour.close( selector );
        });
        $cancelButton.click( function() {
            App.Tour.close( selector );
        });
        
        // create the next/prev buttons if count is more than 1
        //
        if ( count > 1 ) {
            var $nextButton = jQuery( '<a/>', {
                'class' : 'aj-button aj-button-next yellow',
                'text': App.Lang.next,
                'href' : 'javascript:;'
            }).appendTo( $tour );
            var $prevButton = jQuery( '<a/>', {
                'class' : 'aj-button aj-button-prev yellow',
                'text': App.Lang.prev,
                'href' : 'javascript:;'
            }).appendTo( $tour );
            
            $nextButton.click( function() {
                App.Tour.next( selector );
            });
            $prevButton.click( function() {
                App.Tour.prev( selector );
            });
            
            // set up the left/right arrow keys and enter key
            //
            Mousetrap.bind( [ 'right', 'tab' ], function(e) {
                App.Tour.next( selector );
                return false;
            });
            Mousetrap.bind( [ 'left', 'shift+tab' ], function(e) {
                App.Tour.prev( selector );
                return false;
            });
            Mousetrap.bind( [ 'enter' ], function(e) {
                if ( $tour.find( '.aj-button-next' ).is( ':visible' ) ) {
                    App.Tour.next( selector );
                }
                else if ( $tour.find( '.aj-button-done' ).is( ':visible' ) ) {
                    App.Tour.close( selector );
                }
                return false;
            });
            
            $doneButton.hide();
            $prevButton.hide();
        }

        if ( options.disableButtons ) {
            $doneButton.hide();
        }
        
        // start the tour. make sure to move to the top of the page to start. also we
        // want to detach the tour object and re-attach it to the body.
        //
        $.scrollTo( 0, 0 );
        $tour.detach().appendTo( 'body' );
        
        Mousetrap.bind( [ 'escape' ], function(e) {
            App.Tour.close( selector );
            return false;
        });

        this.showStep( selector, 1 );
    },
    
    // go to the previous step in the tour
    //
    prev: function( selector ) {
        var $tour = ( _.isString( selector ) ) 
            ? $( selector )
            : selector,
            options = $tour.data( 'options' );
        
        if ( $tour.data( 'index' ) <= 1 ) {
            $tour.data( 'index', 1 );
            return;
        }
        
        this.unSpotlight( selector );
        
        if ( $tour.data( 'index' ) >= 1 ) {
            $tour.data( 'index', $tour.data( 'index' ) - 1 );
        }
        
        $tour.find( '.aj-button-next' ).show();

        if ( $tour.data( 'index' ) <= 1 ) {
            $tour.find( '.aj-button-prev' ).hide();
        }
        
        if ( $tour.data( 'index' ) < $tour.data( 'count' ) ) {
            $tour.find( '.aj-button-done' ).hide();
        }
        
        this.showStep( selector, $tour.data( 'index' ) );
    },
    
    // go to the next step in the tour
    //
    next: function( selector ) {
        var $tour = ( _.isString( selector ) ) 
            ? $( selector )
            : selector,
            options = $tour.data( 'options' );
        
        if ( $tour.data( 'index' ) >= $tour.data( 'count' ) ) {
            $tour.data( 'index', $tour.data( 'count' ) );
            return;
        }
        
        this.unSpotlight( selector );
        
        if ( $tour.data( 'index' ) < $tour.data( 'count' ) ) {
             $tour.data( 'index', $tour.data( 'index' ) + 1 );
        }
        
        $tour.find( '.aj-button-prev' ).show();

        if ( $tour.data( 'index' ) >= $tour.data( 'count' ) ) {
            $tour.find( '.aj-button-next' ).hide();
            
            if ( ! options.disableButtons ) {
                $tour.find( '.aj-button-done' ).show();
            }
        }
        
        this.showStep( selector, $tour.data( 'index' ) );
    },
    
    // go to a specific step in the tour
    //
    showStep: function( selector, index ) {
        var $tour = ( _.isString( selector ) ) 
            ? $( selector )
            : selector;

        // hide the panels and set up the options
        //
        var options = $tour.data( 'options' );
        
        var $step = $tour.find( 'div:eq(' + ( index - 1 ) + ')' ),
            properties = $step.data( 'properties' ),
            target = properties.target,
            location = properties.location,
            beforeRender = properties.beforeRender,
            scrollPad = parseInt( properties.scrollPad ),
            topPad = parseInt( properties.topPad ),
            leftPad = parseInt( properties.leftPad ),
            cssPosition = properties.cssPosition,
            spotlight = Boolean( properties.spotlight ),
            displayOverlay = properties.displayOverlay,
            highlight = properties.highlight;

        // if we have javascript code to run before the step, do it now
        //
        if ( beforeRender ) {
            eval( beforeRender );
        }

        // check if an overlay request came in
        //
        if ( displayOverlay !== null ) {
            if ( displayOverlay === true ) {
                this.$eltTourOverlay.fadeTo( 0, options.opacity );
                this.$eltTourOverlay.show();
            }
            else {
                this.$eltTourOverlay.hide();
            }
        }

        var self = this; 
        $target = $( target );

        _.defer( function() {
            // if there's no target , display this in the middle of the page
            //
            if ( ! target || ! $target.length || ! $target.is( ':visible' ) ) {
                App.Log.warn( 'No target specified for step ' + index + ' of tour on selector: ' + selector );

                // set the guide css and positioning
                //
                var targetTop = App.Config.tour_notarget_offset_top,
                    targetLeft = App.Config.tour_notarget_offset_left,
                    targetHeight = 0,
                    targetWidth = 0;
            }
            else {
                // set the guide css and positioning
                //
                var targetTop = $target.offset().top,
                    targetLeft = $target.offset().left,
                    targetHeight = $target.outerHeight(),
                    targetWidth = $target.outerWidth();
            }

            // show the tour and step for location calculations
            //
            $tour.find( 'div' ).hide();
            $tour.show();
            $step.show();
            
            $tour.removeClass( "topleft topright bottomleft bottomright" );
            
            if ( ! App.Util.in_array( location, self.locations ) ) {
                location = self.options.location;
            }
            
            $tour.addClass( location );

            var windowHeight = $( window ).height(),
                windowWidth = $( window ).width(),
                tooltipHeight = $tour.outerHeight(),
                tooltipWidth = $tour.outerWidth(),
                tooltipPadding = tooltipHeight + 20,
                scrollLoc = 0;
            
            // tooltip padding is the amount of padding to account for the arrow
            // image in the tour.
            //
            switch ( location ) {
                case 'topleft':
                case 'topright':
                    // we need to scroll far enough to see the tooltip. don't scroll 
                    // if the entire target and tour are inside the window.
                    //
                    if ( targetTop + targetHeight < windowHeight ) {
                        scrollLoc = 0;
                    }
                    else {
                        scrollLoc = targetTop - tooltipPadding - scrollPad;
                    }
                    break;
                case 'bottomleft':
                case 'bottomright':
                    // don't scroll if the entire target and tour are inside the window
                    //
                    if ( targetTop + targetHeight + tooltipPadding < windowHeight ) {
                        scrollLoc = 0;
                    }
                    else {
                        scrollLoc = targetTop + targetHeight + tooltipPadding + scrollPad - windowHeight;
                    }
                    break;
            }

            scrollLoc = ( scrollLoc < 0 )
                ? 0
                : scrollLoc;
            $.scrollTo( scrollLoc, 0 );

            // recompute the target positioning after the scroll
            //
            if ( target && $target.length && $target.is( ':visible' ) ) {
                var targetTop = $target.offset().top,
                    targetLeft = $target.offset().left,
                    targetHeight = $target.outerHeight(),
                    targetWidth = $target.outerWidth();
            }

            // if the tooltip is off the page (left or right) choose the opposite side
            //
            if ( location == 'topleft' || location == 'bottomleft' ) {
                if ( targetLeft + tooltipWidth > windowWidth ) {
                    location = ( location == 'topleft' )
                        ? 'topright'
                        : 'bottomright';
                }
            }
            else {
                if ( targetLeft + targetWidth < tooltipWidth ) {
                    location = ( location == 'topright' )
                        ? 'topleft'
                        : 'bottomleft';
                }
            }

            // move the tooltip to the DOM wherever they specified. we need to compute the 
            // offset from the target based on their location preference.
            //
            switch ( location ) {
                case 'topleft':
                    var offsetTop = tooltipHeight + 16,
                        offsetLeft = 0,
                        arrowOffsetLeft = 10,
                        arrowOffsetTop = tooltipHeight - 3;
                    break;
                case 'topright':
                    var offsetTop = tooltipHeight + 16,
                        offsetLeft = ( tooltipWidth - targetWidth ) * -1,
                        arrowOffsetLeft = tooltipWidth - 49,
                        arrowOffsetTop = tooltipHeight - 3;
                    break;
                case 'bottomleft':
                    var offsetTop = $target.outerHeight() * -1 - 16,
                        offsetLeft = 0,
                        arrowOffsetLeft = 10,
                        arrowOffsetTop = -15;
                    break;
                case 'bottomright':
                    var offsetTop = $target.outerHeight() * -1 - 16,
                        offsetLeft = ( tooltipWidth - targetWidth ) * -1,
                        arrowOffsetLeft = tooltipWidth - 49,
                        arrowOffsetTop = -15;
                    break;
            }

            // set up the arrow based on location
            //
            $tour.find( '.aj-tour-arrow' ).remove();

            if ( App.Config.effect_animate === true ) {
                $tour.animate(
                    {
                        top: targetTop - offsetTop + topPad, 
                        left: targetLeft + offsetLeft + leftPad
                    },
                    250 );
            }
            else {
                $tour.css({ 
                    top: targetTop - offsetTop + topPad, 
                    left: targetLeft + offsetLeft + leftPad
                });
            }

            if ( target && $target.length && $target.is( ':visible' ) ) {
                var $arrowImg = $( "<div/>", {
                    'class' : 'aj-tour-arrow ' + location
                });
                $arrowImg.css({ 
                    top: arrowOffsetTop, 
                    left: arrowOffsetLeft 
                });
                $tour.append( $arrowImg );
            }

            // set the position
            //
            if ( cssPosition != 'fixed' && cssPosition != 'absolute' ) {
                cssPosition = 'absolute';
            }

            $tour.css( 'position', cssPosition );
            
            if ( spotlight ) {
                self.spotlight( selector, index );
            }

            if ( highlight ) {
                App.Page.highlight( $target, 2 );
            }
        });
    },
    
    // destroy the tour and hide any elements if they're showing
    //
    close: function( selector /*, remove */ ) {
        var $tour = ( _.isString( selector ) ) 
            ? $( selector )
            : selector;
        
        this.unSpotlight( selector );
        this.$eltTourOverlay.hide();

        Mousetrap.unbind( [ 'escape' ] );
        Mousetrap.unbind( [ 'right', 'tab' ] );
        Mousetrap.unbind( [ 'left', 'shift+tab' ] );
        Mousetrap.unbind( [ 'enter' ] );
        
        if ( ! $tour.length ) {
            return false;
        }
        
        var options = $tour.data( 'options' ),
            scrollTime = ( $( window ).scrollTop() > 0 )
                ? 500
                : 0;
        
        $tour.find( '.aj-button, .aj-x, .aj-tour-arrow' ).remove();
        $tour.data( 'count', '' );
        $tour.data( 'index', '' );
        $tour.data( 'options', '' );
        $tour.hide();
        
        if ( options.returnTop ) {
            if ( options.onComplete !== false ) {
                $.scrollTo( 0, scrollTime, {
                    onAfter: options.onComplete
                });
            }
            else {
                $.scrollTo( 0, scrollTime );
            }
        }
        else {
            if ( options.onComplete !== false ) {
                options.onComplete();
            }
        }
        
        // remove left/right nav
        //
        $( 'body' ).off( 'keydown.tourNav' );

        // trigger finish event
        //
        $( 'body' ).trigger( 'tourClosed' );
        
        return true;
    },
    
    // bring the target item to the foreground (uses the mask/expose plugin)
    //
    spotlight: function( selector ) {
        var $tour = ( _.isString( selector ) ) 
            ? $( selector )
            : selector,
            index = $tour.data( 'index' ),
            $step = $tour.find( 'div:nth-child(' + index + ')' ),
            properties = $step.data( 'properties' ),
            target = properties.target;
            
        if ( ! $( target ).length ) {
            return false;
        }
        
        $tour.expose({
            'color' : '#000',
            'opacity' : 0.8,
            'closeOnClick' : false,
            'closeSpeed' : 0,
            'loadSpeed' : 0,
            'maskId' : 'aj-tour-overlay'
        });

        return true;

        /*
        var top = $( target ).offset().top,
            left = $( target ).offset().left,
            width = $( target ).width(),
            height = $( target ).height(),
            $clone = $( target ).clone( false );
        
        $( target ).css( 'visibility', 'hidden' );
        
        $clone.css({
            'z-index' : '10000',
            'position' : 'relative',
            'top' : top + 'px',
            'left' : left + 'px'
        }).addClass( 'aj-tour-spotlight' ).appendTo( 'body' );
        */
    },
    
    // remove the target element from the foreground
    //
    unSpotlight: function( selector ) {
        var $tour = $( selector ),
            index = $tour.data( 'index' ),
            $step = $tour.find( 'div:nth-child(' + index + ')' ),
            properties = $step.data( 'properties' ),
            target = properties.target;
            
        if ( ! $( target ).length ) {
            return false;
        }
        
        $.mask.close();

        return true;

        /*
        $( target ).css( 'visibility', 'visible' );
        
        $( '.aj-tour-spotlight' ).remove();
        */
    }
    
});




// End of file
