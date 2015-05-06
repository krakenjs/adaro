adaro
===================

Lead Maintainer: [Aria Stewart](https://github.com/aredridel)  

[![Build Status](https://travis-ci.org/krakenjs/adaro.svg?branch=master)](https://travis-ci.org/krakenjs/adaro)

An expressjs plugin for handling DustJS view rendering. [dustjs-helpers] (https://github.com/linkedin/dustjs-helpers) are
included by default in this module.

```javascript
var express = require('express');
var dustjs = require('adaro');

var app = express();

app.engine('dust', dustjs.dust({ ... });
app.set('view engine', 'dust');

// For rendering precompiled templates:
// app.engine('js', dustjs.js({ ... ));
// app.set('view engine', 'js');
```

Make sure that if you've `app.set('views', somepath)` that the path separators are correct for your operating system.


### Configuration
Config options can be used to specify dust helpers, enabled/disable caching, and custom file loading handlers.

### `layout` (optional) String, Sets default template to use for layout
Dust understands partials, but doesn't understand layouts. Layouts allow you to
skin your application in different ways without having to rewrite all of your
partials.

For example, here are two Dust templates: a layout, and a content page. The
layout includes a special partial with the dynamic name `{_main}`. The content
page has no knowledge of layout; it is itself just a partial.

```html
<html>
  <body>
    {>"{_main}"/}
  </body>
</html>
```

```html
<div>Hello!</div>
```

Using `layout`, when a template is rendered, a layout can be
specified or disabled. As long as the layout template includes the dynamic partial via
`{>"{_main}"/}` the template you asked for will be wrapped in the specified
layout.

```js
// Use alternate layout
dust.render('index', { layout: 'myLayout' }, ...);
```

```js
// Disable layout altogether
dust.render('index', { layout: false }, ...);
```

```html
<html>
  <body>
    <div>Hello!</div>
  </body>
</html>
```



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
