'use strict'
/* SERVER */
var express = require('express'),
    open = require('open'),
    request = require('request'),
    delay = require('delay'),
    app = express(),
    port = process.env["PORT"] || 3000,
    server = app.listen(port),
    localIP = require('ip').address();

console.log(`listening to server on: http://${localIP}:${port}`);

app.use(express.static('public'));

/* DMX */
const config = process.env.CONFIG == "dev" ?
  require('./config-dev'):
  require('./config');

const DMXController = require('./DMXController');

const movingHead = new DMXController(config.dmx);

movingHead.on('open', function() {
  console.log('DMXController connected');
  movingHead.setSpeed(40);
});

/* PID */
let Controller = require('node-pid-controller');

let ctr = new Controller({
  k_p: 0.2,
  k_i: 0.02,
  k_d: 0.4,
  dt: 1
});
ctr.setTarget(0);

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
      case "target":
        // console.log(data);
        var target = data.target;
        let output = target[0];
        let input  = ctr.update(output);
        console.log(input);
        ui.posX -= input/10;

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

      movingHead.setPos(ui.posX, ui.posY, ui.speed);
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
