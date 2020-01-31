'use strict'
/* SERVER */
var express = require('express'),
    open = require('open'),
    request = require('request'),
    app = express(),
    port = process.env["PORT"] || 3000,
    server = app.listen(port);

app.use(express.static('public'));

var localIP = require('ip').address();
console.log(`listening to server on: http://${localIP}:${port}`);
//open(`http://${localIP}:${port}`);

app.get('/fire', function (req, res) {
  res.status(500).send('🔥');
});

/* DMX */
const DMX = require('dmx');
const dmx = new DMX();
const animation = dmx.animation;

const universe = dmx.addUniverse('demo', 'enttec-usb-dmx-pro', '/dev/tty.usbserial-EN275366')

// set start position channel 1 & 3
//universe.update({1: 250, 3: 250});

//set speed
universe.update({5: 90});

/* WEBSOCKET */
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });

var last_state = false;

wss.on('connection', function(ws,req) {
  //console.log(ws._socket.address(), ws.protocol);

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
        //console.log(data);
        var stick = data.sticks[0];
        var x = parseInt(map(stick[1], -1, 1, 0, 255)),
            y = parseInt(map(stick[0], -1, 1, 255, 0));
        //console.log(x, y);
        var button = data.buttons[4]; //button 5
        if (button == true) {
          if (button != last_state) {
            //console.log("fire");
            //console.log(button, last_state);
            fire();
            last_state = button;
          }
        }
        else {
          last_state = false;
        }

      } catch (e) {
        // not json
        var x = 127,
            y = 127;
        console.log(message);
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

function fire() {
  console.log("send ws");
  wss.clients.forEach(client => {
    //console.log(client);
    client.send(`FIRE`);
  });
}

function fireHTTP() {
  console.log("send HTTP");
  request(`http://192.168.1.40:80/fire`, (err, res, body) => {
    if (err) { return console.log(err); }
    console.log(body);
  });
}
