'use strict'
/* SERVER */
var express = require('express'),
    open = require('open'),
    app = express(),
    port = process.env["PORT"] || 3000,
    server = app.listen(port);

app.use(express.static('public'));

var localIP = require('ip').address();
console.log(`listening to server on: http://${localIP}:${port}`);
open(`http://${localIP}:${port}`);


/* DMX */
const DMX = require('dmx');
const dmx = new DMX();
const animation = dmx.animation;

const universe = dmx.addUniverse('demo', 'enttec-usb-dmx-pro', '/dev/tty.usbserial-EN275366')

// channel 1 & 3
// universe.update({1: 250, 3: 250});


/* WEBSOCKET */
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });

wss.on('connection', function(ws,req) {

  //connection is up, let's add a simple simple event
  ws.on('message', function(message) {

    //log the received message and send it back to the client
    //console.log('received: %s', message);

    const broadcastRegex = /^broadcast\:/;

    if (broadcastRegex.test(message)) {
      message = message.replace(broadcastRegex, '');

      //send back the message to the other clients
      wss.clients.forEach(client => {
        if (client != ws) {
          client.send(`Hello, broadcast message -> ${message}`);
        }
      });

    } else {
      //ws.send(`Hello, you sent -> ${message}`);

      try {
        var data = JSON.parse(message);
        var x = parseInt(map(data[0], -1, 1, 0, 255)),
            y = parseInt(map(data[1], -1, 1, 0, 255));
        console.log(x, y);
      } catch (e) {
        // not json
        var x = 127,
            y = 127;
      }

      universe.update({1: x, 3: y});
    }
  });

  //send immediatly a feedback to the incoming connection
  ws.send('Hi there, I am a WebSocket server');
});
console.log(`WebSocket on: ws://${localIP}:${port}`);

function map(value, in_min, in_max, out_min, out_max) {
  return (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

/* GAMEPAD */

var JoyCon = {
  R: {
    vendorId: 1406,
    productId: 8199
  },
  L: {
    vendorId: 1406,
    productId: 8198
  }
}

var HID = require('node-hid');
var devices = HID.devices();

// List devices
//console.log(HID.devices());

// var hid = new HID.HID(vendorId, productId);
// hid.on("data", function(data) {
//   console.log(data);
// });

// var GamePad = require('node-gamepad');
// var controller = new GamePad( 'nintendo/joycon', {
//   vendorID: 1406,
//   productID: 8198
// } );
// controller.connect();
//
// controller.on('left:move', function(data) {
//   console.log( 'move', data );
// });
// controller.on('down:press', function() {
//   console.log( 'down' );
// });
/**/