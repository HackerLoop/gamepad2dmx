// Win: COM3
// OSX: /dev/tty.usbserial-EN275366

const config = {
  dmx: {
    driver: 'enttec-usb-dmx-pro',
    device: '/dev/tty.usbserial-EN275366',
    startChannel: 1,
    nbChannels: 11,
    channels: {
      x: 1,
      y: 3,
      speed: 5
    }
  }
};

module.exports = config;