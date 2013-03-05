/**
 * Template class
 * 
 * Set up templating base. Uses underscore.js for templating.
 */

var TemplateClass = Base.extend({
    
    constructor: function() {},
    
    init: function() {
        App.Log.debug( 'Templating library loaded', 'sys' );
    },
    
    // fetch the template from the user templates file. optionally, data 
    // can be passed in to render with but is not necessary.
    //
    render: function( template /*, data */ ) {
        var data = ( arguments.length > 1 )
            ? arguments[ 1 ]
            : {},
            compiled = _.template( template );
        
        return compiled( data );
    }

});




// End of file
