/**
 * Pager class
 * 
 * Sets up pagination controls onto any element (usually a <table>).
 * You can either include these options as data-attributes or specify
 * them in an options array as the second parameter to create(). the
 * following are the HTML5 data attributes you can specify:
 * 
 *   HTML5 attribute        Class option        Notes
 *   ---------------        ------------        -----
 *   data-paginglength      pageLen             items per page
 *   data-pagingoffset      offset              starts at 0
 *   data-pagincount        count               total records
 *   data-pagingurl         url                 ajax request url
 *   data-pagingtype        type                numeric, prevnext, loadmore
 *   data-paginglinkmax     numericLinkMax      max numeric links to display
 *   n/a                    data                data to be passed to request
 *   n/a                    filterData          field filters for request
 * 
 * Any of the the class options can be passed in as an object as the 
 * second parameter to the create() call. To create paging on an element 
 * call (options array is optional):
 * 
 *   App.Paging.create( '#selector', { options ... } ); 
 * 
 * The class option 'data' is an optional object of variables to be
 * passed in with the ajax call to fetch a new page.
 * 
 * Additionally, you can specify filter arguments the <th> attributes in
 * a table. This creates a live filter form for that element. The following
 * options are available:
 * 
 *   HTML 5 attribute               Notes
 *   ----------------               -----
 *   data-filtername                field name
 *   data-filtertype                text, date 
 *   data-filterplaceholder         placeholder text
 *   data-filtervalue               default value
 *   *data-sortdirection            asc, desc
 *   *data-sorttype                 alphanumeric, date
 * 
 * The field name gets posted to the paging url if the field contains a
 * value.
 */

var PagerClass = Base.extend({
    
    defaults: {
        type : 'numeric',
        numericLinkMax : 10,
        data : {},
        filterData : {},
        scrollPad: 0,
        scrollOnUpdate: true,
        fixedData: {},
        hashUrls: false,
        append: false,
        updateCallback: null
    },
    
    // count of the number of unique page IDs that need to be set
    //
    pageCounter: 0,
    
    // event element to bind and trigger pager events to
    //
    eventElt: null,

    // control access to updating the table
    //
    hashSemaphore: true,
    hashPagerId: null,
    
    constructor: function() {},
    
    // initialize the library
    //
    init: function() {
        App.Log.debug( 'Pager library loaded', 'sys' );

        var self = this;

        // update the pager if we have anything in the hash URL
        //
        App.ready( function() {
            var updatePager = function() {
                var pagerId = App.Url.getHashParam( 'pi' ),
                    pagerPage = App.Url.getHashParam( 'pp' ),
                    pagerFilters = App.Url.getHashParam( 'pf' ),
                    pagerSort = App.Url.getHashParam( 'ps' ),
                    pagerSortDir = App.Url.getHashParam( 'pd' );

                // if we have no pager, get out of here
                //
                if ( ( _.isUndefined( pagerId ) || pagerId == null ) &&
                     self.hashPagerId == null ) {
                    return false;
                }

                App.Log.debug( 'Pager checking for hash params for: ' );
                App.Log.debug( '  --> pagerId: ' + pagerId + ', pagerPage: ' + pagerPage );
                App.Log.debug( '  --> hashPid: ' + self.hashPagerId + ', hashSemaphore: ' + self.hashSemaphore );

                // if the hash semaphore is false, don't update (to prevent duplicate calls)
                //
                if ( self.hashSemaphore === false ) {
                    App.Log.debug( '  --> semaphore false, leaving update pager.' );
                    self.hashSemaphore = true;
                    return;
                }

                if ( ! _.isUndefined( pagerId ) && pagerId !== null ) {
                    var pagerOptions = $( '#' + pagerId ).data( 'options' ),
                        filterData = {};

                    // if it's not loaded yet, try again in a few ms
                    //
                    if ( _.isUndefined( pagerOptions ) ) {
                        _.delay( updatePager, 100 );
                        return;
                    }

                    // get the page
                    //
                    if ( _.isUndefined( pagerPage ) || pagerPage === null ) {
                        pagerPage = 1;
                    }

                    // get any filters
                    //
                    if ( ! _.isUndefined( pagerFilters ) && pagerFilters !== null ) {
                        pagerFilters = pagerFilters.split( ',' );

                        for ( var i = 0; i < pagerFilters.length; i++ ) {
                            var pair = pagerFilters[ i ].split( ':' );

                            if ( pair.length > 0 && pair[ 0 ].length > 0 )
                            {
                                if ( pair.length > 1 ) {
                                    filterData[ pair[ 0 ] ] = pair[ 1 ];
                                }
                            }
                        }
                    }

                    // set up sort if there is one
                    //
                    if ( ! _.isUndefined( pagerSort ) && pagerSort !== null ) {
                        pagerSortDir = ( ! _.isUndefined( pagerSortDir ) && pagerSortDir.length > 0 )
                            ? pagerSortDir
                            : 'asc';

                        pagerOptions[ 'sort' ] = pagerSort;
                        pagerOptions.sortDir = pagerSortDir;
                    }
                    else {
                        pagerOptions[ 'sort' ] = '';
                    }

                    pagerOptions.offset = ( pagerPage - 1 ) * pagerOptions.pageLen;
                    pagerOptions.filterData = filterData;

                    // update the form controls to display the filter data
                    //
                    self.updateFilterControls( pagerOptions );
                    self.update( pagerOptions, function() {
                        self.hashSemaphore = true;
                    });
                }
                else if ( self.hashPagerId !== null ) {
                    App.Log.debug( '  --> hash pager ID found, resetting table' );

                    var pagerOptions = $( '#' + self.hashPagerId ).data( 'options' );

                    pagerOptions.offset = 0;
                    pagerOptions.filterData = {};
                    pagerOptions[ 'sort' ] = '';
                    self.hashPagerId = null;

                    // update the form controls to display the filter data
                    //
                    self.updateFilterControls( pagerOptions );
                    self.update( pagerOptions, function() {
                        self.hashSemaphore = true;
                    });
                }
            };

            // save this method to the on hash change event
            //
            App.Url.hashChange( updatePager );

            // and call it
            //
            updatePager();
        });
    },
    
    // set up pagination on an element. create the pager element,
    // update the options, and make the call to render for the first time.
    //
    create: function( selector /*, options */ ) {
        var options = ( arguments.length > 1 )
            ? arguments[ 1 ]
            : {};

        // check if container is unique. should be a CSS ID.
        //
        var $container = ( _.isString( selector ) )
            ? $( selector )
            : selector;
        
        if ( $container.length > 1 || ! $container.length ) {
            App.Log.warn( 
                'Pager create() attempted to set up pagination on selector "' + 
                selector + '" of length: ' + $container.length );
            return false;
        }
        
        App.Log.startBenchmark( 'pag' );
        App.Log.debug( 'Creating pagination on "' + selector + '"', 'pag' );
        App.Message.setStatus( App.Lang.pager_rendering, 'pagerRender' );
        App.Message.setStatus( App.Lang.pager_rendering, 'pagerHeaders' );
        
        // get the ID or set it using pageCounter
        //
        var containerId = $container.attr( 'id' );
        
        if ( ! containerId ) {
            $container.attr( 'id', 'aj-pager-elt-' + this.pageCounter );
        }
        
        // save the page reference
        //
        $container.data( 'pagerId', 'aj-pager-' + this.pageCounter );
        
        // set up the options
        //
        var elementOptions = {
            pageLen : $container.data( 'paginglength' ),
            offset : $container.data( 'pagingoffset' ),
            count : $container.data( 'pagingcount' ),
            url : $container.data( 'pagingurl' ),
            type : $container.data( 'pagingtype' ),
            scrollPad : ( $container.data( 'pagingscrollpad' ) )
                ? $container.data( 'pagingscrollpad' )
                : 0,
            containerId : 'aj-pager-elt-' + this.pageCounter,
            pagerId : 'aj-pager-' + this.pageCounter
        };

        baseOptions = $.extend( {}, this.defaults, elementOptions );
        options = $.extend( {}, baseOptions, options );

        // create the paging container
        //
        var $pager = jQuery( '<div/>', {
            'class' : 'aj-pager ' + options.type,
            'id' : options.pagerId
        });
        
        $pager.insertAfter( $container );
        $pager.data( 'options', options );

        // render the controls and links
        //
        this.render( options );
        
        // add any header controls if they're specified
        //
        this.addHeaderFilters( options );
        this.pageCounter++;
        
        App.Log.debug( 'Finished creating pagination on "' + selector + '"', 'pag' );
        App.Log.stopBenchmark( 'pag' );

        return true;
    },
    
    getOptions: function( selector ) {
        var $container = ( _.isString( selector ) )
            ? $( selector )
            : selector;
        var $pager = $( '#' + $container.data( 'pagerId' ) ),
            options = $pager.data( 'options' );

        return options;
    },
    
    reset: function( selector /*, refresh */ ) {
        var $container = ( _.isString( selector ) )
            ? $( selector )
            : selector;
        
        if ( $container.length > 1 || ! $container.length ) {
            App.Log.error( 
                'Pager reset() attempted to reset pagination on a selector of length: ' +
                $container.length )
            return false;
        }
        
        var refresh = ( arguments.length > 1 )
            ? arguments[ 1 ]
            : false;
        
        App.Message.setStatus( App.Lang.pager_rendering, 'pagerRender' );
        
        var $pager = $( '#' + $container.data( 'pagerId' ) );
        var options = $pager.data( 'options' );
        
        options.offset = 0;
        
        this.render( options );
        
        if ( refresh ) {
            this.update( options );
        }
    },
    
    // render the pagination
    //
    render: function( options ) {
        switch ( options[ 'type' ] ) {
            case 'numeric':
                this.numeric( options );
                break;
                
            case 'prevnext':
                this.prevNext( options );
                break;
                
            case 'loadmore':
                this.loadMore( options );
                break;
        }
    },
    
    // set up pagination on an element. creates numerical navigation
    // in the specified "pageId" and attaches on-click event handlers
    // on each page link.
    //
    numeric: function( options ) {
        var displayCount = options.numericLinkMax,
            firstPage = 1,
            lastPage = 1,
            activePage = Math.floor( options.offset  / options.pageLen ) + 1,
            totalPages = ( options.count % options.pageLen == 0 )
                ? Math.floor( options.count / options.pageLen )
                : Math.floor( options.count / options.pageLen ) + 1;
            
        // if the active page is more than displayCount / 2, we need to 
        // set the firstPage to be activePage - displayCount/2 + 1 and
        // lastPage to be firstPage + displayCount for now.
        //
        if ( activePage > Math.floor( displayCount / 2 ) ) {
            firstPage = activePage - Math.floor( displayCount / 2 ) + 1;
            lastPage = firstPage + displayCount - 1;
        }
        else {
            lastPage = displayCount;
        }

        // if the lastPage is outside the total and the count we need 
        // to adjust it from the end.
        //
        if ( lastPage > totalPages && lastPage > displayCount ) {
            lastPage = totalPages;
            firstPage = ( totalPages >= displayCount )
                ? lastPage - displayCount + 1
                : 1;
        }
        else if ( lastPage > totalPages ) {
            lastPage = totalPages;
        }
        
        var $pager = $( '#' + options.pagerId );
        $pager.html( '' );
        $pager.off( 'click', 'a.aj-pager-change' );

        if ( firstPage >= lastPage ) {
            $pager.hide();
            App.Message.unsetStatus( 'pagerRender' );
            return false;
        }

        // iterate through the page numbers and create the page links
        //
        for ( var i = firstPage; i <= lastPage; i++ ) {
            var $a = jQuery( '<a/>', {
                'class' : 'aj-pager-change',
                'href' : 'javascript:;',
                'text' : i
            });
            
            if ( i == activePage ) {
                $a.addClass( 'active' );
            }
            
            $a.data( 'page', i );
            $( '#' + options.pagerId ).append( $a );
        }

        // add the total results
        //
        var context = 
            ( parseInt( options.offset ) + 1 ) + 
            ' - ' +
            Math.min( parseInt( options.offset ) + parseInt( options.pageLen ), options.count ) +
            ' of ' +
            App.Util.add_commas( options.count );
        $( '#' + options.pagerId )
            .append( '<span class="context">' + context + '</span>' );
        
        // set up click handler for links
        //
        var self = this;
        
        $( '#' + options.pagerId ).on( 'click', 'a.aj-pager-change', function() {
            var page = $( this ).data( 'page' ),
                pagerOptions = $( '#' + options.pagerId ).data( 'options' );

            pagerOptions.offset = ( page - 1 ) * pagerOptions.pageLen;
            pagerOptions.filterData = self.getFilterData( options );

            self.update( pagerOptions );
        });

        $pager.show();
        
        App.Message.unsetStatus( 'pagerRender' );
    },
    
    // sets up a next / prev button to leaf through pages for the
    // specified element.
    //
    prevNext: function( options ) {
        
        
        App.Message.unsetStatus( 'pagerRender' );
    },
    
    // create a load more button to add additional 
    //
    loadMore: function( options ) {
        // create the load more link
        //
        var $pager = $( '#' + options.pagerId ),
            $container = $( '#' + options.containerId );

        $pager.html( '' );
        $pager.off( 'click', 'a.aj-pager-change' );

        // if there's no more, exit out
        //
        if ( options.offset + options.pageLen > options.count ) {
            App.Message.unsetStatus( 'pagerRender' );
            return false;
        }

        var self = this,
            $a = jQuery( '<a/>', {
            'class' : 'aj-pager-change',
            'href' : 'javascript:;',
            'text' : App.Lang.pager_load_more
        });
        
        $a.data( 'offset', options.offset + options.pageLen );
        $( '#' + options.pagerId ).append( $a );

        $( '#' + options.pagerId ).on( 'click', 'a.aj-pager-change', function() {
            var offset = $( this ).data( 'offset' ),
                pagerOptions = $( '#' + options.pagerId ).data( 'options' );

            pagerOptions.offset = offset;
            pagerOptions.filterData = self.getFilterData( options );

            var callback = ( _.isFunction( pagerOptions.updateCallback ) )
                ? pagerOptions.updateCallback
                : function() { return true; };

            self.update( pagerOptions, callback );
        });

        App.Message.unsetStatus( 'pagerRender' );
    },
        
    // read in the pager element and load data for the requested
    // options. the options that come back from the server need to be
    // updated onto the pager element. after this we want to re-render 
    // the pagination for the specified type.
    //
    update: function( options /*, callback */ ) {
        App.Message.setStatus( App.Lang.loading, 'pagerRender' );

        var self = this,
            data = jQuery.extend( true, {}, options.data ),
            callback = function() { return true; };

        if ( arguments.length > 1 ) {
            callback = arguments[ 1 ];
        }

        data = _.extend( data, options.fixedData, options.filterData );

        data.limit = options.pageLen;
        data.offset = options.offset;
        data[ 'sort' ] = options[ 'sort' ];
        data.sortDir = options.sortDir;

        App.Request.ajaxPost(
            options.url,
            data,
            function( response ) {
                // if the container is a table we want to update the body, otherwise
                // just set the html of the container
                //
                var $container = $( '#' + options.containerId );

                if ( $container.is( "table" ) ) {
                    if ( $container.data( 'tbodys' ) ) {
                        $container.find( 'tbody' ).remove();
                        $container.find( 'thead' ).after( response.data.html );
                    }
                    else {
                        if ( options.append ) {
                            $container.find( 'tbody' ).append( response.data.html );
                        }
                        else {
                            $container.find( 'tbody' ).html( response.data.html );
                        }
                    }
                }
                else {
                    if ( options.append ) {
                        $container.append( response.data.html );
                    }
                    else {
                        $container.html( response.data.html );
                    }
                }

                // scroll to the top of the container (plus some padding) if it's enabled
                //
                if ( options.scrollOnUpdate == true ) {
                    var pos = Math.max( $container.offset().top - 10 + options.scrollPad, 0 );
                    $( 'body' ).scrollTo( pos, 250 );
                }

                // if paging options came back, update them otherwise update with
                // the options passed in.
                //
                if ( typeof response.pager !== "undefined" && response.pager ) {
                    options.url = response.pager.pagingurl;
                    options.type = response.pager.pagingtype;
                    options.count = response.pager.pagingcount;
                    options.pageLen = response.pager.paginglimit;
                    options.offset = response.pager.pagingoffset;
                }

                self.render( options );

                // if we're saving hash URLs, set the pager ID, page, and any filters. also,
                // buffer these into an array so it happens at once and not multiple times.
                //
                if ( options.hashUrls ) {
                    var filterString = [],
                        sortExists = false,
                        hashParamQueue = {};

                    // set the page number
                    //
                    if ( options.offset == 0 ) {
                        hashParamQueue.pp = null;
                        //App.Url.setHashParam( 'pp', null );
                    }
                    else {
                        hashParamQueue.pp = Math.floor( options.offset / options.pageLen ) + 1;
                        //App.Url.setHashParam( 'pp', Math.floor( options.offset / options.pageLen ) + 1 );
                    }

                    // iterate through filter data
                    //
                    for ( i in options.filterData ) {
                        filterString.push( i + ':' + options.filterData[ i ] );
                    }

                    if ( filterString.length ) {
                        filterString = filterString.join( ',' );
                        hashParamQueue.pf = filterString;
                        //App.Url.setHashParam( 'pf', filterString );
                    }
                    else {
                        hashParamQueue.pf = null;
                        //App.Url.setHashParam( 'pf', null );
                    }

                    // set up any sorts
                    //
                    if ( ! _.isUndefined( options[ 'sort' ] ) && options[ 'sort' ].length > 0 ) {
                        sortExists = true;
                        hashParamQueue.ps = options[ 'sort' ];
                        hashParamQueue.pd = options.sortDir;
                        //App.Url.setHashParam( 'ps', options[ 'sort' ] );
                        //App.Url.setHashParam( 'pd', options.sortDir );
                    }
                    else
                    {
                        hashParamQueue.ps = null;
                        hashParamQueue.pd = null;
                        //App.Url.setHashParam( 'ps', null );
                        //App.Url.setHashParam( 'pd', null );
                    }

                    // if there's nothing in the hash, remove the ID
                    //
                    if ( ! filterString.length && options.offset == 0 && ! sortExists ) {
                        hashParamQueue.pi = null;
                        //App.Url.setHashParam( 'pi', null );
                    }
                    else {
                        hashParamQueue.pi = options.pagerId;
                        //App.Url.setHashParam( 'pi', options.pagerId );
                    }

                    // set semaphore to false so that we don't update twice
                    //
                    self.hashSemaphore = false;
                    self.hashPagerId = options.pagerId;
                    App.Url.setHashParam( hashParamQueue );
                }
                
                // save the updated options to the pager. remove the filter data before doing this
                // because that changes every time.
                //
                options.filterData = {};
                $( '#' + options.pagerId ).data( 'options', options );
                
                // run the callback if we have one
                //
                callback( options );

                // trigger the pager updated on the container for anything listening
                //
                $container.trigger( 'pager_updated' );

                return true;
            }, {
                onError: function() {
                    App.Message.unsetStatus( 'pagerRender' );
                    return true;
                }
            }
        );
    },
    
    // set up filters for the table if they're specified in the <th>.
    // this is only available on tables with <th>s that have the
    // required data attributes.
    //
    addHeaderFilters: function( options ) {
        var $container = $( '#' + options.containerId ),
            $pager = $( '#' + options.pagerId ),
            self = this,
            headerCount = 0;

        if ( ! $container.is( "table" ) ) {
            App.Message.unsetStatus( 'pagerHeaders' ); // set in create()
            return;
        }
        
        $container.find( 'th' ).each( function() {
            var isFiltered = $( this ).data( 'filter' ),
                filterName = $( this ).data( 'filtername' ),
                filterType = $( this ).data( 'filtertype' ),
                filterSize = $( this ).data( 'filtersize' ),
                filterPlaceholder = $( this ).data( 'filterplaceholder' ),
                filterValue = $( this ).data( 'filtervalue' ),
                isSorted = $( this ).data( 'sort' ),
                sortField = $( this ).data( 'sortfield' ),
                sortDir = $( this ).data( 'sortdirection' );

            // filterName is required for this, so check if it exists
            //
            if ( isFiltered && isFiltered != "0" && isFiltered != "" ) {
                // create the node 
                //
                headerCount++;

                // check if there's a size class
                //
                var sizeClass = ( filterSize )
                    ? ' aj-size-' + filterSize
                    : '';
                var $node = jQuery( '<div/>', {
                    'class' : 'aj-th-filter' + sizeClass
                });
                var $clear = jQuery( '<a/>', {
                    'class' : 'aj-field-clear aj-th-filter-clear',
                    'href' : 'javascript:;'
                });
                
                // create the filter and event handler to submit action
                //
                switch ( filterType ) {
                case 'date':
                    var $filter = jQuery( '<input/>', {
                        'class' : 'aj-th-filter-field aj-th-filter-date',
                        'value' : filterValue,
                        'placeholder' : filterPlaceholder,
                        'name' : filterName,
                        'type' : 'text'
                    });
                    $node.append( $filter );
                    $node.append( $clear );
                    break;
                    
                case 'select':
                    var $filter = self.createHeaderSelect( 
                        filterName, filterValue, filterPlaceholder );
                    $node.append( $filter );
                    break;

                case 'text':
                default:
                    var $filter = jQuery( '<input/>', {
                        'class' : 'aj-th-filter-field aj-th-filter-text',
                        'value' : filterValue,
                        'placeholder' : filterPlaceholder,
                        'name' : filterName,
                        'type' : 'text'
                    });
                    $node.append( $filter );
                    $node.append( $clear );
                    break;
                }
                
                $node.appendTo( $( this ) );
                $node.find( '.aj-th-filter-date' ).datepicker({
                    onSelect: function( dateText, inst ) {
                        var pagerOptions = $( '#' + options.pagerId ).data( 'options' );
                        pagerOptions.offset = 0;
                        pagerOptions.filterData = self.getFilterData( options );
                        self.update( pagerOptions );
                    }
                });
            }
            else {
                var $node = jQuery( '<div/>', {
                    'class' : 'aj-th-filter'
                });
                
                $node.appendTo( $( this ) );
            }
            
            // if there's a sort, transform the th text to a link for sorting
            //
            if ( isSorted ) {
                var $span = $( this ).find( 'span' );
                
                sortDir = ( sortDir )
                    ? sortDir
                    : 'asc';
                    
                var $sort = jQuery( '<a/>', {
                    'class' : 'aj-th-filter-sort',
                    'href' : 'javascript:;'
                });
                
                $span.detach().appendTo( $sort );
                $sort.data( 'sortdefault', sortDir );
                $sort.data( 'sortfield', sortField );
                
                $( this ).prepend( $sort );
            }
        });

        // if there were no headers, remove the th-filter divs
        //
        if ( ! headerCount ) {
            $container.find( '.aj-th-filter' ).remove();
        }
        
        // save the update options to the pager
        //
        $pager.data( 'options', options );
        
        // attach keypress handler to text fields
        //
        $( '#' + options.containerId ).on( 'keypress.filter', '.aj-th-filter-text', function( e ) {
            var code = ( e.keyCode ? e.keyCode : e.which );
            if ( code == App.Const.key_enter ) {
                // submit the update: find the pager, grab the options, add t
                // the name:value and send the update request. we want to 
                // actually clear the data first (reset the offset too) and
                // pull in all of the filters for the request.
                //
                $( this ).data( 'lastValue', $( this ).val() );
                
                var pagerOptions = $( '#' + options.pagerId ).data( 'options' );
                pagerOptions.offset = 0;
                pagerOptions.filterData = self.getFilterData( options );
                self.update( pagerOptions );
                
                return false;
            }
        });
        
        // attach focus and blur handler to text fields
        //
        $( '#' + options.containerId ).on( 'focus.filter', '.aj-th-filter-text', function( e ) {
            // save the value in the history
            //
            $( this ).data( 'lastValue', $( this ).val() );
        });
        
        $( '#' + options.containerId ).on( 'blur.filter', '.aj-th-filter-text', function( e ) {
            // if the current value differs, update the paging/data. save the
            // new value to the history.
            //
            if ( $( this ).val() != $( this ).data( 'lastValue' ) ) {
                $( this ).data( 'lastValue', $( this ).val() );
                
                var pagerOptions = $( '#' + options.pagerId ).data( 'options' );
                
                pagerOptions.offset = 0;
                pagerOptions.filterData = self.getFilterData( options );
                self.update( pagerOptions );
                
                return false;
            }
        });

        // attach change method to selects
        //
        $( '#' + options.containerId ).on( 'change.filter', '.aj-th-filter-select', function( e ) {
            // update the pager with the new value
            //
            var pagerOptions = $( '#' + options.pagerId ).data( 'options' ),
                val = $( this ).val(),
                $div = $( this ).parent();

            if ( ! val ) {
                $div.removeClass( 'active' )
                    .find( 'a' ).html( $div.data( 'placeholder' ) );
            }
            else {
                $div.addClass( 'active' )
                    .find( 'a' )
                    .html( 
                        $( this ).find( 'option[value="' + val + '"]' ).text() );
            }

            pagerOptions.offset = 0;
            pagerOptions.filterData = self.getFilterData( options );
            self.update( pagerOptions );
            
            return false;
        });
        
        // attach field clear methods
        //
        $( '#' + options.containerId ).on( 'click.filter', '.aj-th-filter-clear', function( e ) {
            $( this ).prev().val( '' ).data( 'lastValue', '' );
            
            var pagerOptions = $( '#' + options.pagerId ).data( 'options' );
            pagerOptions.offset = 0;
            pagerOptions.filterData = self.getFilterData( options );
            self.update( pagerOptions );
            
            return false;
        });

        // attach sort methods
        //
        $( '#' + options.containerId ).on( 'click.sort', '.aj-th-filter-sort', function( e ) {
            var direction = $( this ).data( 'sortdefault' ),
                fieldName = $( this ).data( 'sortfield' );
            
            // we want to switch the direction if it's set
            //
            if ( $( this ).hasClass( 'asc' ) ) {
                direction = 'desc';
            }
            else if ( $( this ).hasClass( 'desc' ) ) {
                direction = 'asc';
            }
                
            var pagerOptions = $( '#' + options.pagerId ).data( 'options' );
            
            pagerOptions[ 'sort' ] = fieldName;
            pagerOptions.sortDir = direction;
            pagerOptions.filterData = self.getFilterData( options );
            
            $( '#' + options.containerId + ' .aj-th-filter-sort' ).removeClass( 'on' );
            $( this ).removeClass( 'asc desc' ).addClass( direction ).addClass( 'on' );

            self.update( pagerOptions );
            return false;
        });
        
        App.Message.unsetStatus( 'pagerHeaders' ); // set in create()
    },
    
    // parse the filter options for the specified table and return back
    // a data object with the variables set (or unset).
    //
    getFilterData: function( options ) {
        var $container = $( '#' + options.containerId ),
            filterData = {};

        if ( ! $container.is( "table" ) ) {
            // check if there is a filterData attr set on the container
            //
            if ( $container.data( 'filterData' ) ) {
                return $container.data( 'filterData' );
            }

            return {};
        }
        
        $container.find( '.aj-th-filter-field' ).each( function() {
            if ( $( this ).val() ) {
                filterData[ $( this ).attr( 'name' ) ] = $( this ).val();
            }
        });

        return filterData;
    },

    // read in the filter options for the table and update the controls
    // to reflect those filter values
    //
    updateFilterControls: function( options ) {
        var $container = $( '#' + options.containerId ),
            filterData = options.filterData;

        if ( ! $container.is( "table" ) ) {
            return {};
        }

        // iterate through the fields and set the values accordingly
        //
        for ( i in filterData ) {
            var $elt = $( '#' + options.containerId + ' [name="' + i + '"]' ),
                value = filterData[ i ];

            $elt.val( value );

            // if it's a select field we need to update the display
            //
            if ( $elt.hasClass( 'aj-th-filter-select' ) ) {
                var $a = $elt.prev(),
                    displayValue = $elt.find( 'option[value="' + value + '"]' ).text();

                $a.text( displayValue );
                $a.parent().addClass( 'active' );
            }
        }

        // iterate through the sorts and set them accordingly
        //
        if ( ! _.isUndefined( options[ 'sort' ] ) && options[ 'sort' ].length ) {
            var $th = $( '[data-sortfield="' + options[ 'sort' ] + '"]' ),
                $a = $th.find( 'a' );

            $th.data( 'sortdirection', options.sortDir );
            $a.removeClass( 'asc desc' ).addClass( options.sortDir ).addClass( 'on' );
        }
        else {
            $container.find( '.aj-th-filter-sort' ).removeClass( 'asc desc on' );
        }

        return true;
    },

    // create a div "select" field for the table headers
    //
    createHeaderSelect: function( name, values, placeholder ) {
        // create the hidden select
        //
        var $select = jQuery( '<select/>', {
            'class' : 'aj-th-filter-field aj-th-filter-select',
            'placeholder' : placeholder,
            'name' : name
        });

        $select.append( '<option value=""></option>' )
               .fadeTo( 0, 0 );

        if ( ! _.isEmpty( values ) ) {
            for ( key in values ) {
                $select.append( '<option value="' + key + '">' + values[ key ] + '</option>' );
            }
        }

        // create the div wrapper
        //
        var $div = jQuery( '<div/>', {
            'class' : 'aj-th-filter-select-wrap'
        });
        var $a = jQuery( '<a/>', {
            'text' : placeholder
        });

        $div.data( 'placeholder', placeholder )
            .append( $a )
            .append( $select );

        return $div;
    }

});




// End of file
