// Win: COM3
// OSX: /dev/tty.usbserial-AD0JL34E

const config = {
  dmx: {
    driver: 'enttec-open-usb-dmx',
    device: '/dev/tty.usbserial-AD0JL34E',
    startChannel: 1,
    nbChannels: 11,
    channels: {
      x: 1,
      y: 3,
      speed: 9
    }
  }
};

module.exports = config;