# GamePad to DMX

Node.js example to use a Gamepad to send DMX data.

## How to

Use the cmd line `ls /dev/tty.*` in a terminal to find the port of your enttec-usb-dmx-pro.

Edit `public/inde.html` with the WebSocket url.

```
npm i

npm start
```

## Modules

- [dmx](https://github.com/node-dmx/dmx)

## Environment dev

- Tomshine DMX-512 80W Lyre LED
- Enttec USB DMX Pro
- Nintendo Switch Joy-Con

- macOs Catalina 10.15.2
- node v12.13.0

## Help

```
'Xbox One Wired Controller'
vendorId: 1118,
productId: 746,

'Joy-Con (R)'
vendorId: 1406,
productId: 8199,

'Joy-Con (L)'
vendorId: 1406,
productId: 8198,
```