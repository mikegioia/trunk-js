#!/bin/bash

# get a compilation suffix if one exists
#
SUFFIX=${1:-""}

API_URL=http://closure-compiler.appspot.com/compile
COMPILATION_LEVEL=SIMPLE_OPTIMIZATIONS
DATEFORMAT=`date +"%d%m%y"`;
#NEWFILE="build${DATEFORMAT}.js";
SYSBUILDFILE="sys.js";
WEBBUILDFILE="web.js";
SYSCONFIGFILE="conf/compile-js.sys.conf";
WEBCONFIGFILE="conf/compile-js.web.conf";
BUILDDIR="sys/build/";
RUNSYS=1
RUNWEB=1

# if suffix files exist, use them. otherwise default to base
# files.
#
if [ -n "$SUFFIX" ] ; then
    SYSBUILDFILE="sys.${SUFFIX}.js";
    WEBBUILDFILE="web.${SUFFIX}.js";

    if [ -f "conf/compile-js.sys.${SUFFIX}.conf" ] ; then
        SYSCONFIGFILE="conf/compile-js.sys.${SUFFIX}.conf";
    fi

    if [ -f "conf/compile-js.web.${SUFFIX}.conf" ] ; then
        WEBCONFIGFILE="conf/compile-js.web.${SUFFIX}.conf";
    fi
fi

# iterate through all files in sys config file
#
if [ $RUNSYS == 1 ] ; then
    code="";
    while read LINE
    do
        firstchar=${LINE:0:1}
        if [[ -n $LINE && "#" != $firstchar ]];
          then
            code="${code} --data-urlencode js_code@${LINE}";
        fi
    done < $SYSCONFIGFILE

    # compile the sys build file
    #
    `curl \
    --url ${API_URL} \
    --header 'Content-type: application/x-www-form-urlencoded' \
    ${code} \
    --data output_format=text \
    --data output_info=compiled_code \
    --data compilation_level=${COMPILATION_LEVEL} \
    --output ${SYSBUILDFILE}`
    
    chmod 755 ${SYSBUILDFILE}
    mv ${SYSBUILDFILE} ${BUILDDIR}
fi

# iterate through all files in web config file
#
if [ $RUNWEB == 1 ] ; then
    code="";
    while read LINE
    do
        firstchar=${LINE:0:1}
        if [[ -n $LINE && "#" != $firstchar ]];
          then
            code="${code} --data-urlencode js_code@${LINE}";
        fi
    done < $WEBCONFIGFILE

    # compile the web build file
    #
    `curl \
    --url ${API_URL} \
    --header 'Content-type: application/x-www-form-urlencoded' \
    ${code} \
    --data output_format=text \
    --data output_info=compiled_code \
    --data compilation_level=${COMPILATION_LEVEL} \
    --output ${WEBBUILDFILE}`
    
    chmod 755 ${WEBBUILDFILE}
    mv ${WEBBUILDFILE} ${BUILDDIR}
fi
