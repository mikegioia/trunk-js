/**
 * Home page
 */

var HomePage = new PageClass;
HomePage.extend({

    // set up page event handlers
    //
    load: function() {
        this.base();

        // defer DOM handling until after callstack is finished
        //
        var self = this;
        _.defer( function() {
            self.example();
        });
        
        App.Log.debug( 'HomePage load()', 'sys' );
    },

    example: function() {
        // page code goes here
        //
    }

});




// End of file
