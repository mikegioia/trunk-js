/**
 * Config class
 * 
 * Set up configuration base
 */

var ConfigClass = Base.extend({
    
    constructor: function() {},
    
    init: function() {
        App.Log.debug( 'Config library loaded', 'sys' );
    },
    
    // logging
    //
    log_level: 4,                       // integer, 0-4 with 0 being none
    prod_log_level: 1,                  // 1 for just errors, 0 for none
    event_url: null,                    // string, relative path,
    log_page_views: false,              // bool
    log_error_server: false,            // bool
    
    // messaging
    //
    message_notif_animate: true,        // bool
    message_notif_location: 'top',      // 'top' or 'bottom'
    message_expire: true,               // bool
    message_expire_length: 15000,       // integer (ms)
    
    // effects
    //
    effect_animate: true,               // bool
    
    // validation
    //
    validate_password_minlength: 6,     // integer
    validate_password_selector: 'input[name="password"]',
    validate_zip_minlength: 5,          // integer
    validate_display_notif: true,       // bool

    // tour
    //
    tour_notarget_offset_top: 10,
    tour_notarget_offset_left: 10,

    // modal
    //
    modal_theme: null,                  // string
    modal_button_classes: '',           // string
    modal_positioning: 'top',           // 'middle' or 'top'
    modal_positioning_top_px: 50,       // integer
    modal_content_classes: '',          // string
    modal_hide_html_scrollbar: false    // bool
    
});




// End of file
