express-dustjs
===================

An expressjs plugin for handling DustJS view rendering.

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