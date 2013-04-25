/**
 * Page class
 * 
 * Configured for setting up document ready scripts and page specific tasks
 */

var PageClass = Base.extend({
    
    constructor: function() {},
    
    init: function() {
        App.Log.debug( 'Page library loaded', 'sys' );
    },
    
    load: function() {},

    returnTop: function() {
        this.scrollTo( 'top' );
    },

    // highlight an element on the page
    //
    highlight: function( selector /* numTimes, fgColor, bgColor */ ) {
        var $item = ( _.isString( selector ) )
            ? $( selector )
            : selector;

        if ( ! $item.length ) {
            App.Log.debug( "Page highlight failed on selector: " + selector );
            return false;
        }

        // get the default background color
        //
        if ( $item.css( 'background-color' ) == 'none' ) {
            defaultBg = 'rgba(0,0,0,0)';
        }
        else {
            defaultBg = $item.css( 'background-color' )
        }

        var numTimes = ( arguments.length > 1 )
            ? arguments[ 1 ]
            : 1;
        var fgColor = ( arguments.length > 2 )
            ? arguments[ 2 ]
            : App.Const.highlight_fg_color;
        var bgColor = ( arguments.length > 3 )
            ? arguments[ 3 ]
            : defaultBg;

        if ( ! _.isNumber( numTimes ) || numTimes <= 0 ) {
            App.Log.debug( "Page highlight failed on non-positive integer numTimes: " + numTimes );
            return false;
        }
        
        if ( ! bgColor ) {
            bgColor = $item.css( 'background-color' );
        }

        var doHighlight = function() {
            $item
                .animate(
                    { 'background-color' : fgColor },
                    150 )
                .animate(
                    { 'background-color' : bgColor },
                    150 );
        };

        doHighlight();

        if ( numTimes > 1 ) {
            var intervalId = setInterval( doHighlight, 300 );

            setTimeout( function() {
                clearInterval( intervalId )
            }, numTimes * 300 );
        }

        return true;
    },

    // scroll to an element on the page
    //
    scrollTo: function( selector /*, options */ ) {
        var reservedWords = [ 'top', 'bottom' ],
            moveTo = null;

        if ( _.isString( selector ) &&
             App.Util.in_array( selector, reservedWords ) ) {
            var $item = $( 'body' );
            
            if ( selector === 'top' ) {
                moveTo = 0;
            }
            else if ( selector === 'bottom' ) {
                var docHeight = ( document.height !== undefined ) 
                    ? document.height 
                    : document.body.offsetHeight;
                moveTo = docHeight - $( window ).height();
            }
        }
        else {
            var $item = ( _.isString( selector ) )
                ? $( selector )
                : selector;
        }

        if ( ! $item.length ) {
            App.Log.debug( "Page highlight failed on selector: " + selector );
            return false;
        }

        // load in options
        //
        // auto scroll time computes the scroll time based on scrolling distance
        //
        var defaults = {
            topPadding: 0,
            elementToHighlight: null,
            scrollTime: 'auto',
            highlightCount: null
        };
        var options = ( arguments.length > 1 )
            ? arguments[ 1 ]
            : {};

        options = _.extend(
            defaults,
            options );

        // compute the distance to travel and get a time if auto isn't set
        //
        if ( moveTo === null ) {
            moveTo = $item.offset().top + parseInt( options.topPadding );
        }

        var distanceToTravel = $( window ).scrollTop() - moveTo,
            scrollTime = ( options.scrollTime == 'auto' )
                ? Math.abs( distanceToTravel ) * 0.9
                : options.scrollTime;

        $( window ).scrollTo( moveTo, scrollTime );

        // if highlightCount is non-null, and elementToHighlight is null, then
        // use $item as the elementToHighlight.
        //
        if ( _.isNumber( options.highlightCount ) && 
            _.isNull( options.elementToHighlight ) ) {
            options.elementToHighlight = $item;
        }

        if ( options.elementToHighlight !== null ) {
            var self = this;

            _.delay( function() {
                self.highlight( 
                    options.elementToHighlight,
                    options.highlightCount );
            }, scrollTime );
        }

        return true;
    }
    
});




// End of file
