const gw = require('gif-writer');
const IndexedColorImage = gw.IndexedColorImage;
const MedianCutColorReducer = gw.MedianCutColorReducer;
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const canvas = createCanvas(500, 500);
const ctx = canvas.getContext('2d');

const pumpkin = loadImage('./assets/pumpkin.jpg');
console.log('here');
console.log(pumpkin);
let indexedColorImage;

pumpkin
  .then((img) => {
    ctx.drawImage(img, 0, 0);
    const pumpkinData = ctx.getImageData(0, 0, img.width, img.height);
    indexedColorImage = convertImgDataToIndexedColorImage(pumpkinData, 255);
    writeGifData();
    writeDataToFile();
  })
  .catch((err) => {
    console.log('oh no!', err);
  });

function convertImgDataToIndexedColorImage(imgData, paletteSize) {
  var reducer = new MedianCutColorReducer(imgData, paletteSize);
  var paletteData = reducer.process();
  var dat = Array.prototype.slice.call(imgData.data);
  var indexedColorImageData = [];
  for (var idx = 0, len = dat.length; idx < len; idx += 4) {
    var d = dat.slice(idx, idx + 4); // r,g,b,a
    indexedColorImageData.push(reducer.map(d[0], d[1], d[2]));
  }
  return new IndexedColorImage(
    { width: imgData.width, height: imgData.height },
    indexedColorImageData,
    paletteData
  );
}

var MyOutputStream = /** @class */ (function () {
  function MyOutputStream() {
    this.buffer = [];
  }
  MyOutputStream.prototype.writeByte = function (b) {
    this.buffer.push(b);
  };
  MyOutputStream.prototype.writeBytes = function (bb) {
    Array.prototype.push.apply(this.buffer, bb);
  };
  return MyOutputStream;
})();

// This object is used by GifWriter. Only two methods `writeByte` and `writeBytes` are
// required.
var outputStream = new MyOutputStream();

// Write GIF data to outputStream.
function writeGifData() {
  console.log('writing gif data');
  var gifWriter = new gw.GifWriter(outputStream);
  gifWriter.writeHeader();
  gifWriter.writeLogicalScreenInfo({
    width: indexedColorImage.width,
    height: indexedColorImage.height,
  });
  gifWriter.writeTableBasedImage(indexedColorImage);
  gifWriter.writeTrailer();
}
// Write data to file. (node.js)
function writeDataToFile() {
  console.log('writing data to file');
  var buf = Buffer.from(outputStream.buffer);
  fs.writeFile('test.gif', buf, function (err) {
    if (err) console.log(err);
    else console.log("It's saved!");
  });
}
