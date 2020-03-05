/*
 * https://github.com/andypotato/dmx-controller-demo/
 *
 */
const DMX = require('dmx');
const EventEmitter = require('events');

const config_default = {
  driver: 'enttec-open-usb-dmx',
  device: '/dev/tty.usbserial-AD0JL34E',
  startChannel: 1,
  nbChannels: 11,
  channels: {
    x: 1,
    y: 3,
    speed: 9
  }
};

module.exports = class DMXController extends EventEmitter {

  // construction
  constructor(config) {
    super();

    this.universe = null;
    this.channels = [];

    this.config = Object.assign(config_default, config);

    for (var i = 0; i < this.config.nbChannels; i++) {
      this.channels[i] = this.config.startChannel+i;
    }

    this.connect();
  }

  connect() {
    let self = this;
    // create universe
    const dmx = new DMX();

    this.universe = dmx.addUniverse('demo', this.config.driver, this.config.device);

    this.universe.dev.on('open', function(err) {
      self.emit('open');
    })

    this.universe.dev.on('error', function(err) {
      console.log('Error: ', err.message);
    })

    this.universe.dev.on('close', (stream) => {
      console.log('close!');
    });

    // let there be (no) light
    this.universe.updateAll(0);
  }

  update(channels) {
    if (!this.universe.dev.isOpen) {
      this.connect();
    }
    this.universe.update(channels);
  }

  // accessors
  setSpeed(speed) {
    this.update({
      [this.config.channels.speed]: speed
    });
  }

  setPos(x, y, speed) {
    var payload = {
      [this.config.channels.x]: x,
      [this.config.channels.y]: y
    };
    if (speed) {
      payload[this.config.channels.speed] = speed;
    }
    this.update(payload);
  }

}