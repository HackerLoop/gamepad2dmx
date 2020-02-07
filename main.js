'use strict'
/* SERVER */
var express = require('express'),
    open = require('open'),
    request = require('request'),
    app = express(),
    port = process.env["PORT"] || 3000,
    server = app.listen(port);

const delay = require('delay');

app.use(express.static('public'));

var localIP = require('ip').address();
console.log(`listening to server on: http://${localIP}:${port}`);
//open(`http://${localIP}:${port}`);

app.get("/handshake", function(req, res){
  res.status(200).send(`${localIP}:${port}`);
});

/* DMX */
const DMX = require('dmx');
const dmx = new DMX();
const animation = dmx.animation;

const config = [
  {
    universe: {
      name: 'pro',
      driver: 'enttec-usb-dmx-pro',
      id: '/dev/tty.usbserial-EN275366'
    },
    x: 1,
    y: 3,
    speed: 5
  },
  {
    universe: {
      name: 'dev',
      driver: 'enttec-open-usb-dmx',
      id: '/dev/tty.usbserial-AD0JL34E'
    },
    x: 1,
    y: 3,
    speed: 9
  }
];

var fixture = config[0];

if (process.env.CONFIG) {
  fixture = config[process.env.CONFIG];
}

//const universe = dmx.addUniverse('demo', 'enttec-usb-dmx-pro', '/dev/tty.usbserial-EN275366')
// const universe = dmx.addUniverse('demo', 'enttec-open-usb-dmx', '/dev/tty.usbserial-AD0JL34E')
const universe = dmx.addUniverse(fixture.universe.name, fixture.universe.driver, fixture.universe.id)

// set start position channel 1 & 3
//universe.update({1: 250, 3: 250});

//set speed
//universe.update({5: 90});

//set default pos and speed
universe.update({[fixture.x]: 85, [fixture.y]: 0, [fixture.speed]: 90});

/* WEBSOCKET SERVER */
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });

var ui = {},
    last_speed = 0;

wss.on('connection', function(ws,req) {
  //console.log(ws._socket.address(), ws.protocol);

  //connection is up, let's add a simple simple event
  ws.on('message', function(message) {

    //log the received message and send it back to the client
    // console.log('received: %s', message);

    try {
      var data = JSON.parse(message);
    } catch (e) {
      //console.log(e);
      var data = {
        type: "text",
        message: message
      };
    }

    switch(data.type) {
      case "broadcast":
        //send back the message to the other clients
        wss.clients.forEach(client => {
          if (client != ws) {
            client.send(`Hello, broadcast message -> ${message}`);
          }
        });
        break;
      case "text":
        console.log(data.message);
        //ws.send(`Hello, you sent -> ${data.message}`);
        break;
      case "ui":
        // console.log(data);
        ui = data.sliders;
        break;
      case "gamepad":
        // console.log(data);
        //ws.send(`Hello, you sent -> ${message}`);

        ui.posX += data.gamepad.axes[1] * ui.multi;
        ui.posY += data.gamepad.axes[0] * ui.multi;
        // speed = map(Math.abs(data.gamepad.axes[1]), 0, 1, 200, 1);
        updateUi(ws);

        onButtonPressed(data.gamepad.buttons, 6, function() {
          console.log("fire");

          fire();
        });

        onButtonPressed(data.gamepad.buttons, 8, function() {
          console.log("waypoint");

          (async () => {
            last_speed = ui.speed;
            ui.speed = 1;
            ui.posX = 91;
            ui.posY = 25;
            updateUi(ws)

            await delay(500);

            //fire();
            ui.speed = last_speed;
          })();

        });

        break;
    }

    if (ui.posX !== undefined) {

      ui.posX = Math.min(Math.max(parseInt(ui.posX), ui.minX), ui.maxX);
      ui.posY = Math.min(Math.max(parseInt(ui.posY), ui.minY), ui.maxY);

      // console.log(ui.posX, ui.posY);

      universe.update({[fixture.x]: ui.posX, [fixture.y]: ui.posY, [fixture.speed]: ui.speed});
    }
  });

  //send immediatly a feedback to the incoming connection
  ws.send('Hi there, I am a WebSocket server');
});
console.log(`WebSocket on: ws://${localIP}:${port}`);

function map(value, in_min, in_max, out_min, out_max) {
  return (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

var last_state = {};
function onButtonPressed(buttons, id, callback) {
  var button = buttons[id];
  if (button == true) {
    if (button != last_state[id]) {
      callback();
      last_state[id] = button;
    }
  }
  else {
    last_state[id] = false;
  }
}

function updateUi(ws) {
  ws.send(JSON.stringify({
    type: "data",
    data: ui
  }));
}

var applyDeadzone = function(number, threshold){
   var percentage = (Math.abs(number) - threshold) / (1 - threshold);

   if(percentage < 0)
      percentage = 0;

   return percentage * (number > 0 ? 1 : -1);
}

function fire() {
  // console.log("send ws");
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
