/**
 * Constants class
 * 
 * Set up constants base
 */

var ConstClass = Base.extend({
    
    constructor: function() {},
    
    init: function() {
        App.Log.debug( 'Constants library loaded', 'sys' );
    },
    
    url: {
        log_error_server: '',
        request_ping: ''
    },

    url_enable_hash: false,
    
    key_down: 40,
    key_enter: 13,
    key_left: 37,
    key_right: 39,
    key_up: 38,
    key_tab: 9,

    lang_english: 'english',
    
    status_error: 'error',
    status_success: 'success',
    status_info: 'info',
    
    type_html: 'html',
    type_json: 'json',
    type_script: 'script',
    type_xml: 'xml',
    
    event_page_view: 'pageView',
    event_click: 'click',
    
    request_local_storage: false,
    request_local_wait_ms: 5000,

    highlight_fg_color: '#EAEA62'
    
});




// End of file
