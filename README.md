adaro
===================

Lead Maintainer: [Aria Stewart](https://github.com/aredridel)  

[![Build Status](https://travis-ci.org/krakenjs/adaro.svg?branch=master)](https://travis-ci.org/krakenjs/adaro)

An expressjs plugin for handling DustJS view rendering. [dustjs-helpers](https://github.com/linkedin/dustjs-helpers) are
included by default in this module.

```javascript
var express = require('express');

var app = express();

var adaro = require('adaro');

var options = {
  helpers: [
    //NOTE: function has to take dust as an argument.
    //The following function defines @myHelper helper
    function (dust) { dust.helpers.myHelper = function (a, b, c, d) {} },
    '../my-custom-helpers',   //Relative path to your custom helpers works
    'dustjs-helpers',   //So do installed modules
    {
      name: '../my-custom-helpers/helper-to-render-data-with-args',
      // or use this signature if you need to pass in additional args
      arguments: { "debug": true }
    }
  ]
};

app.engine('dust', adaro.dust(options));
app.set('view engine', 'dust');

// For rendering precompiled templates:
// app.engine('js', adaro.js({ ... ));
// app.set('view engine', 'js');
```

Make sure that if you've `app.set('views', somepath)` that the path separators are correct for your operating system.


### Configuration
Config options can be used to specify dust helpers, enabled/disable caching, and custom file loading handlers.



#### `helpers` (optional) String Array, helper module names
A helper module must either:
- Conform to the API established by [dustjs-helpers] (https://github.com/linkedin/dustjs-helpers) provided by LinkedIn or 
- Export a function which accepts a single argument (being dust itself). Such files should generally be designed for use on both client and server.

Client and Server Compatible
```javascript
function setupHelpers(dust) {

   // Add helpers

}

if (typeof exports !== 'undefined') {
    module.exports = setupHelpers;
} else {
    setupHelpers(dust);
}
```

Alternate API
```javscript
module.exports = function (dust) {
    // Add helpers
};
```


#### `cache` (optional, defaults to true) Boolean
Set to true to enable dust template caching, or false to disable.


```javascript
app.engine('dust', dustjs.dust({ cache: false }));
app.set('view engine', 'dust');
```

#### `helpers` (optional) An array of helper modules to require and use.

Expects helpers to be in the form of:

```
module.exports = function (dust, [options]) {
    dust.helpers.something = function (chunk, context, bodies, params) {
    };
};
```

## Breaking changes

#### `v1.0.0`

* Removed the `layout:` option to render and in configuration
* Dust is our own private instance, not global. If you load helpers, you must do it in the configuration of adaro.
* We outright require dust. We will not use your application's installed version.
* Dust ~2.7.1 is required. Dust minors are breaking changes, so those affect users of this module too.
* Paths passed to the engine that are filesystem absolute paths will be used as is, and not resolved against the view root.
* `dustjs-helpers` is not loaded for you automatically. Add it to your helpers configuration if you want it. Make sure you use a version compatible with the dustjs-linkedin that adaro uses.
