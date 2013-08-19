/*!
 * Trunk JavaScript Framework v1.0.0
 * http://trunkjs.com/
 *
 * Copyright 2012, Mike Gioia
 * Licensed under the MIT license.
 * http://trunkjs.com/docs/license
 */

// Base class
//
// Version 1.1
// Copyright 2006-2010, Dean Edwards
// License: http://www.opensource.org/licenses/mit-license.php
//
var Base = function() {
    // dummy
};

Base.extend = function(_instance, _static) { // subclass
    var extend = Base.prototype.extend;
    
    // build the prototype
    //
    Base._prototyping = true;
    
    var proto = new this;
    
    extend.call(proto, _instance);
    proto.base = function() {
        // call this method from any other method to invoke that method's ancestor
        //
    };
    
    delete Base._prototyping;
    
    // create the wrapper for the constructor function
    // var constructor = proto.constructor.valueOf(); //-dean
    var constructor = proto.constructor;
    var klass = proto.constructor = function() {
        if (!Base._prototyping) {
            if (this._constructing || this.constructor == klass) { // instantiation
                this._constructing = true;
                constructor.apply(this, arguments);
                delete this._constructing;
            } else if (arguments[0] != null) { // casting
                return (arguments[0].extend || extend).call(arguments[0], proto);
            }
        }
    };
    
    // build the class interface
    //
    klass.ancestor = this;
    klass.extend = this.extend;
    klass.forEach = this.forEach;
    klass.implement = this.implement;
    klass.prototype = proto;
    klass.toString = this.toString;
    klass.valueOf = function(type) {
        return (type == "object") ? klass : constructor.valueOf();
    };
    extend.call(klass, _static);
    
    // class initialisation
    //
    if (typeof klass.init == "function") klass.init();
    
    return klass;
};

Base.prototype = {  
    extend: function(source, value) {
        // extending with a name/value pair
        //
        if (arguments.length > 1) {
            var ancestor = this[source];
            if (ancestor && (typeof value == "function") && // overriding a method?
                // the valueOf() comparison is to avoid circular references
                (!ancestor.valueOf || ancestor.valueOf() != value.valueOf()) &&
                /\bbase\b/.test(value)) {
                // get the underlying method
                //
                var method = value.valueOf();
                // override
                value = function() {
                    var previous = this.base || Base.prototype.base;
                    this.base = ancestor;
                    var returnValue = method.apply(this, arguments);
                    this.base = previous;
                    return returnValue;
                };
                
                // point to the underlying method
                //
                value.valueOf = function(type) {
                    return (type == "object") ? value : method;
                };
                
                value.toString = Base.toString;
            }
            this[source] = value;
            
        // extending with an object literal
        //
        } else if (source) {
            var extend = Base.prototype.extend;
            // if this object has a customised extend method then use it
            //
            if (!Base._prototyping && typeof this != "function") {
                extend = this.extend || extend;
            }
            var proto = {toSource: null};
            
            // do the "toString" and other methods manually
            //
            var hidden = ["constructor", "toString", "valueOf"];
            
            // if we are prototyping then include the constructor
            //
            var i = Base._prototyping ? 0 : 1;
            while (key = hidden[i++]) {
                if (source[key] != proto[key]) {
                    extend.call(this, key, source[key]);

                }
            }
            
            // copy each of the source object's properties to this object
            //
            for (var key in source) {
                if (!proto[key]) extend.call(this, key, source[key]);
            }
        }
        return this;
    }
};

// Initialize
//
Base = Base.extend({
    constructor: function() {
        this.extend(arguments[0]);
    }
}, {
    ancestor: Object,
    version: "1.1",
    
    forEach: function(object, block, context) {
        for (var key in object) {
            if (this.prototype[key] === undefined) {
                block.call(context, object[key], key, object);
            }
        }
    },
        
    implement: function() {
        for (var i = 0; i < arguments.length; i++) {
            if (typeof arguments[i] == "function") {
                // if it's a function, call it
                //
                arguments[i](this.prototype);
            } else {
                // add the interface using the extend method
                //
                this.prototype.extend(arguments[i]);
            }
        }
        return this;
    },
    
    toString: function() {
        return String(this.valueOf());
    }
});

// Create console if it doesn't exist (IE)
//
if ( ! window.console ) {
    console = {
        log: function() {},
        info: function() {},
        warn: function() {},
        error: function() {}
    };
}

// Set up the application object. this is set up via an App configure line in the document or elsewhere.
// App contains all of the files to be included for the app to run if configured in development mode.
// For production mode it will look to include a packaged file.
//
var AppClass = Base.extend({

    // application variables
    //
    appEnv: 'web',
    appFolder: 'app/',
    appPath: null,
    appComplete: false,
    benchTime: {},
    build: null,
    callstack: {
        init: 0,
        sys: 0,
        app: 0,
        user: 0
    },
    env: 'development',
    finalComplete: false,
    initComplete: false,
    jsPath: '',
    language: 'english',
    loadCallback: null,
    libraries: [],
    pages: [],
    readyQueue: [],
    rootPath: '',
    sysCompelte: false,
    sysFolder: 'sys/',
    sysPath: null,
    userComplete: false,
    version: null,
    working: false,
    
    // system classes
    //
    Config: null,
    Const: null,
    Lang: null,
    Log: null,
    Message: null,
    Modal: null,
    Page: null,
    Pager: null,
    Request: null,
    Template: null,
    Tour: null,
    Url: null,
    Validate: null,
    Util: null,

    // constructor
    //
    constructor: function() {},

    // base level error reporting to the browser
    //
    err: function( type, message ) {
        var err = new Error();  
        err.type = type;
        err.message = message;
        throw( err );
    },
    
    // base level console writing
    //
    debug: function( message ) {
        console.log( message );
    },
    
    // implement ready queue of javascript to be executed when the document is
    // loaded. this replaces jQuery's $(document).ready() function since jQuery may
    // not be loaded by the time a ready() is invoked in page JS.
    //
    ready: function( code ) {
        if ( this.finalComplete === true ) {
            code();
        }
        else {
            this.readyQueue.push( code );
        }
    },
    
    // benchmarking utility. we want to track how long scripts take to
    // execute. if log benchmarking is enabled in the config, all log messages
    // will be preceded with the key and time since creation. the App.init()
    // sets the 'sys' key benchmark when it's first called and this timer is
    // killed when the application is finished initializing everything. other
    // parts of the application that wish to use benchmarking can refer to
    // the Log class for more information.
    //
    benchmark: function( /* key, destroy */ ) {
        var key = ( arguments.length == 1 )
            ? 'sys'
            : arguments[ 0 ];
            
        // if the key isn't set then we need to initiate the start time for
        // the key in benchTime
        //
        var date = new Date();
        
        if ( ! this.benchTime.hasOwnProperty( key ) ) {
            this.benchTime[ key ] = {
                startMs: date.getTime(),
                currentMs: date.getTime()
            };
        }
        else {
            this.benchTime[ key ].currentMs = date.getTime();
        }
        
        var ret = this.benchTime[ key ].currentMs - this.benchTime[ key ].startMs;
        
        if ( arguments.length == 2 && arguments[ 1 ] == true && this.benchTime.hasOwnProperty( key ) ) {
            delete this.benchTime[ key ];
        }
        
        return ret;
    },
    
    // initialize the application based on environment. throw an error to the console if this fails since
    // no other libraries have been or will be loaded at this point.
    //
    init: function( callback ) {
        this.debug( '[sys ' + this.benchmark() + ']  Initializing application' ); 
        
        if ( callback != undefined ) {
            this.loadCallback = callback;
        }
        
        // set up application paths
        //
        this.appPath = this.jsPath + this.appFolder + this.appEnv + '/';
        this.sysPath = this.jsPath + this.sysFolder;
        
        // load files based on the environment. load() will push a stack counter when called, and pop one
        // when loading is completed. when all the files are completed we'll execute the config() method.
        //
        var self = this;
        var cb = function() {
            self.sysConfig();
        };
        
        switch ( this.env ) {
        case 'production':
            // load the packaged sys file. if a build was specified, load that file
            //
            var buildSuffix = ( this.build )
                ? "." + this.build
                : "";
            this.callstack.init = 1;
            this.load( this.sysPath + 'build/sys' + buildSuffix + '.js', cb );
            break;
            
        case 'development':
            // load the core files (jQuery, lang, page, events, ajax, and other components)
            //
            this.callstack.init = 14;
            this.load( this.sysPath + 'lib/jquery.js', cb );
            this.load( this.sysPath + 'lib/lang.js', cb );
            this.load( this.sysPath + 'lib/page.js', cb );
            this.load( this.sysPath + 'lib/message.js', cb );
            this.load( this.sysPath + 'lib/modal.js', cb );
            this.load( this.sysPath + 'lib/request.js', cb );
            this.load( this.sysPath + 'lib/url.js', cb );
            this.load( this.sysPath + 'lib/pager.js', cb );
            this.load( this.sysPath + 'lib/log.js', cb );
            this.load( this.sysPath + 'lib/validate.js', cb );
            this.load( this.sysPath + 'lib/config.js', cb );
            this.load( this.sysPath + 'lib/constants.js', cb );
            this.load( this.sysPath + 'lib/template.js', cb );
            this.load( this.sysPath + 'lib/tour.js', cb );
            break;
            
        default:
            err( 'Fatal error', 'Invalid environment specified' );
        }
    },
    
    sysConfig: function() {
        // check the init callstack. if 0 proceed, otherwise decrement and
        // return.
        //
        if ( this.callstack.init > 0 ) {
            this.callstack.init--;
        }
        
        if ( this.callstack.init <= 0 ) {
            this.initComplete = true;
            this.callstack.init = 0;
        }
        else {
            return;
        }
        
        this.debug( '[sys ' + this.benchmark() + ']  Configuring system' ); 
        
        // configure the core classes (allow for app library extending)
        //
        this.Page = new PageClass;
        this.Lang = new LangClass;
        this.Message = new MessageClass;
        this.Modal = new ModalClass;
        this.Request = new RequestClass;
        this.Url = new UrlClass;
        this.Log = new LogClass;
        this.Config = new ConfigClass;
        this.Const = new ConstClass;
        this.Pager = new PagerClass;
        this.Validate = new ValidateClass;
        this.Template = new TemplateClass;
        this.Tour = new TourClass;
        
        // set up on window load complete for working dialog
        //
        this.ready( function() {
            setTimeout( "App.Message.unsetWorking();", 500 );
        });
        
        var self = this;
        var cb = function() {
            self.appConfig();
        };
            
        switch ( this.env ) {
        case 'production':
            // load the packaged app file
            //
            var buildSuffix = ( this.build )
                ? "." + this.build
                : "";
            this.callstack.sys = 1;
            this.load( this.sysPath + 'build/' + this.appEnv + buildSuffix + '.js', cb );
            break;
            
        case 'development':
            this.callstack.sys = 12 + this.libraries.length + this.pages.length;
            
            // load the system plugins
            //
            this.load( this.sysPath + 'plugins/jquery.scrollTo.js', cb );
            this.load( this.sysPath + 'plugins/jquery.form.js', cb );
            this.load( this.sysPath + 'plugins/jquery.ui.js', cb );
            this.load( this.sysPath + 'plugins/jquery.validate.js', cb );
            this.load( this.sysPath + 'plugins/jquery.hashchange.js', cb );
            this.load( this.sysPath + 'plugins/jquery.mask.js', cb );
            this.load( this.sysPath + 'plugins/jquery.color.js', cb );
            
            // load any helpers
            //
            this.load( this.sysPath + 'helpers/utility.js', cb );
            this.load( this.sysPath + 'helpers/modernizr.js', cb );
            this.load( this.sysPath + 'helpers/underscore.js', cb );
            this.load( this.sysPath + 'helpers/mousetrap.js', cb );
            
            // load extensions
            //
            this.load( this.sysPath + 'lang/' + this.language +'.js', cb );
            
            // load the additional app libraries specified in the config options
            //
            if ( this.libraries.length ) {
                for ( i in this.libraries ) {
                    this.load( this.appPath + 'lib/' + this.libraries[ i ], cb );
                }
            }
            
            // load the app pages specified in the config options
            //
            if ( this.pages.length ) {
                for ( i in this.pages ) {
                    this.load( this.appPath + 'pages/' + this.pages[ i ], cb );
                }
            }
        }
    },
    
    // configure the application once the includes are loaded
    //
    appConfig: function() {
        // check the sys callstack. if 0 proceed, otherwise decrement and
        // return.
        //
        if ( this.callstack.sys > 0 ) {
            this.callstack.sys--;
        }
        
        if ( this.callstack.sys <= 0 ) {
            this.sysComplete = true;
            this.callstack.sys = 0;
        }
        else {
            return;
        }
        
        this.debug( '[sys ' + this.benchmark() + ']  Configuring application' ); 

        // if we're in production mode set the prod log level
        //
        if ( this.env == 'production' ) {
            App.Config.log_level = App.Config.prod_log_level;
        }
        
        // instantiate the classes
        //
        this.Page.init();
        this.Lang.init();
        this.Message.init();
        this.Modal.init();
        this.Request.init(); // depends on constants
        this.Url.init();
        this.Log.init();
        this.Config.init();
        this.Const.init();
        this.Pager.init();
        this.Template.init();
        this.Tour.init();
        this.Validate.init(); // depends on language
        
        // set up the sys lang
        //
        this.Lang.extend( SysLang );

        // add the helper object
        //
        this.Util = window.$AppUtil;
        
        // set up working if enabled
        //
        if ( this.working ) {
            this.Message.setWorking();
        }
        
        var self = this;
        var cb = function() {
            self.userConfig();
        };
        
        switch ( this.env ) {
        case 'production':
            // bypassing the callback because there's nothing to load
            //
            this.userConfig();
            break;

        case 'development':
            this.callstack.app = 2;
            
            // load the system and app plugin dependencies
            //
            
            // load the app constants and configs
            //
            this.load( this.appPath + 'config/constants.js', cb );
            this.load( this.appPath + 'config/config.js', cb );
        }
    },
    
    // user configuration (i.e. lang and anything else loaded last)
    //
    userConfig: function() {
        // check the app callstack. if 0 proceed, otherwise decrement and
        // return.
        //
        if ( this.callstack.app > 0 ) {
            this.callstack.app--;
        }
        
        if ( this.callstack.app <= 0 ) {
            this.appComplete = true;
            this.callstack.app = 0;
        }
        else {
            return;
        }
        
        this.debug( '[sys ' + this.benchmark() + ']  Configuring user' ); 
        
        var self = this;
        var cb = function() {
            self.complete();
        };
        
        switch ( this.env ) {
        case 'production':
            // bypassing the callback because there's nothing to load
            //
            this.complete();
            break;
            
        case 'development':
            this.callstack.user = 2;
            
            // load the language file(s)
            //
            this.load( this.appPath + 'lang/' + this.Config.language + '.js', cb );
            
            // load the templates
            //
            this.load( this.appPath + 'config/templates.js', cb );
        }
    },
    
    complete: function() {
        // check the user callstack. if 0 proceed, otherwise decrement and
        // return.
        //
        if ( this.callstack.user > 0 ) {
            this.callstack.user--;
        }
        
        if ( this.callstack.user <= 0 ) {
            this.userComplete = true;
            this.callstack.user = 0;
        }
        else {
            return;
        }
        
        this.debug( '[sys ' + this.benchmark() + ']  Performing cleanup' ); 
        var self = this;
        
        $( document ).ready( function() {
            // run the load complete callback
            //
            _.defer( function() {
                self.loadCallback();
            
                // empty the ready queue now that we're done
                //
                for ( i in self.readyQueue ) {
                    self.readyQueue[ i ]();
                } 
                
                self.readyQueue = [];
                self.finalComplete = true;
            });
        });
        
        // application benchmarking finished. destroy 'sys' using the second
        // parameter.
        //
        this.debug( '[sys ' + this.benchmark( 'sys', true ) + '] Application initialization complete' ); 
    },
    
    // load the requested file
    //
    load: function( url /*, callback */ ) {
        var script = document.createElement( "script" );
        script.type = "text/javascript";

        var self = this,
            callback = ( arguments.length > 1 )
                ? arguments[ 1 ]
                : function() { return; };
        
        if ( script.readyState ){  // IE
            script.onreadystatechange = function() {
                if ( script.readyState == "loaded" || script.readyState == "complete" ) {
                    script.onreadystatechange = null;
                    callback();
                }
            };
        } else {  // others
            script.onload = function() {
                callback();
            };
        }

        // append static resource versioning to the url
        //
        if ( this.version ) {
            script.src = url + '?v=' + this.version;
        }
        else {
            script.src = url;
        }
        
        document.getElementsByTagName( "head" )[0].appendChild( script );
    }
    
});

var App = new AppClass;




// End of file
