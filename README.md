express-dustjs
===================

An expressjs plugin for handling DustJS view rendering. [dustjs-helpers] (https://github.com/linkedin/dustjs-helpers) are
included by default in this module.

```javascript
var express = require('express');
var dustjs = require('express-dustjs');

var app = express();

app.engine('dust', dustjs.dust({ ... });
app.set('view engine', 'dust');

// For rendering precompiled templates:
// app.engine('js', dustjs.js({ ... ));
// app.set('view engine', 'js');
```


### Configuration
Config options can be used to specify dust helpers, enabled/disable caching, and custom file loading handlers.

#### `helpers` (optional) String Array, helper module names
A helper module must conform the API as established by [dustjs-helpers] (https://github.com/linkedin/dustjs-helpers) provided
by LinkedIn or export as a function which accepts a sungle argument (being dust itself). Such files souch genreally be designed
for use on both client and server.

Client and Server Compatible
```javascript
(function (dust) {

   // Add helpers

}(typeof exports !== 'undefined' ? module.exports = require('dustjs-linkedin') : dust));
```

Alternate API
```javscript
module.exports = function (dust) {
    // Add helpers
};
```


#### `cache` (optional, defaults to true) Boolean
Set to true to enable dust template caching, or false to disable. If a custom onLoad handler is defined, caching is
disabled and assumed to be handled by the client.


#### `onLoad` (optional) Function with the signature `function (name, [context], callback)`
Define a file read handler for use by dust in loading files.
```javascript
dustjs.onLoad = function (name, context, callback) {
    // Custom file read/processing pipline
    callback(err, str);
}

app.engine('dust', dustjs.dust({ cache: false }));
app.set('view engine', 'dust');
```
