/**
 * Validation class
 * 
 * Provides hook into jQuery validate plugin. This class sets up the common
 * validation rules and messages with a way to to tie form element names
 * to predetermined validation rules.
 * 
 * Other methods are used to toggle message placement and hook into the
 * plugin's features easier.
 */

var ValidateClass = Base.extend({

    constructor: function() {},
    rules: {},
    messages: {},
    
    // takes any jQuery validation plugin options. these are the defaults
    // used. submitHandler should be used for managing any callbacks or
    // ajax submissions (not tested yet).
    //
    defaults: {
        debug: false,
        ignore: '.ignore',
        errorClass: 'aj-validate-error',
        successClass: 'aj-validate-success'
    },
    
    // initialize the library
    //
    init: function() {
        var self = this;
        
        _.defer( function() {
            self.initRules();
            self.initMessages();
        });
        
        App.Log.debug( 'Validate library loaded', 'sys' );
    },
    
    // set up validation for the specified form. rulesMap can be used here to map
    // input names with the predefined rules.
    //
    create: function( selector /*, rulesMap, options */ ) {
        var $form = ( _.isString( selector ) )
            ? $( selector )
            : selector;
        var options = {},
            rulesMap = {},
            vOptions = this.defaults;
            
        if ( $form.length > 1 || ! $form.length ) {
            App.Log.error( 
                'Validate create() attempted to set up validation on a selector of length: ' + 
                $form.length );
            return;
        }
        
        if ( arguments.length > 1 ) {
            rulesMap = arguments[ 1 ];
        }

        if ( arguments.length > 2 ) {
            options = arguments[ 2 ];
        }

        // set up the rules and messages. rulesMap can be used here to map
        // input names with the predefined rules. the format looks like:
        //
        //   { '[input name]' : '[validator rule]' ... }
        //
        // if rulesMap isn't specified, additional rules and messages can 
        // be set in the options object. finally, the validator will look for
        // attributes or classnames on the fields to set up any validation.
        //
        if ( rulesMap ) {
            vOptions.rules = {};
            vOptions.messages = {};

            for ( i in rulesMap ) {
                vOptions.rules[ i ] = this.rules[ rulesMap[ i ] ];
                vOptions.messages[ i ] = this.messages[ rulesMap[ i ] ];
            }
        }

        // set up the custom error placement. we want to add the error label
        // after a label if it's a checkbox/label combo.
        //
        vOptions.errorPlacement = function( error, element ) {
            // Confirm with MG whether to notify in addition to add labels - users are overlooking 
            // error labels on validation
            // 
            if ( element.next().prop( 'tagName' ) == 'LABEL' ) {
                error.insertAfter( element.next() );
            }
            else {
                error.insertAfter( element );   
            }
        };

        vOptions.showErrors = function ( errorMap, errorList ) {
            if ( errorList.length > 0 ) {
                App.Message.notify( "Oops! Something on the form isn't valid." );    
            }
            
            this.defaultShowErrors();
            return true;
        };

        // if custom rules, messages or settings were added, extend the 
        // options to have them take precedent.
        //
        $.extend( vOptions, options );
        
        $form.validate( vOptions );
    },
    
    // set up the rules to be used. the names are pre-defined types so
    // that we can map form input names to these and not have to worry
    // about defining rules for each different field name.
    //
    initRules: function() {
        $.extend( this.rules, {
            text: 'required',
            email: {
                required: true,
                email: true
            },
            password: {
                required: true,
                minlength: App.Config.validate_password_minlength
            },
            passwordConfirm: {
                required: true,
                minlength: App.Config.validate_password_minlength,
                equalTo: App.Config.validate_password_selector
            },
            agree: 'required',
            zip: {
                required: true,
                minlength: App.Config.validate_zip_minlength
            }
        });
    },

    // textual messages for each errory type in the above rules. extend
    // the validation library in the app libraries to add additional rules
    // and messages.
    //
    initMessages: function() {
        $.extend( this.messages, {
            text: App.Lang.validate_text,
            email: {
                required: App.Lang.validate_email_required,
                email: App.Lang.valida_email
            },
            password: {
                required: App.Lang.validate_password_required,
                minlength: App.Lang.validate_password_minlength
            },
            passwordConfirm: {
                required: App.Lang.validate_passwordconfirm_required,
                minlength: App.Lang.validate_passwordconfirm_minlength,
                equalTo: App.Lang.validate_passwordconfirm_equalto
            },
            agree: App.Lang.validate_agree,
            zip: {
                required: App.Lang.validate_zip_required,
                minlength: App.Lang.validate_zip_minlength
            }
        });        
    }
    
});




// End of file
