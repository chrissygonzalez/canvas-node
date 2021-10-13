var express = require('express');
const app = express();
const port = 8000;

const gw = require('gif-writer');
const IndexedColorImage = gw.IndexedColorImage;
const MedianCutColorReducer = gw.MedianCutColorReducer;
const fs = require('fs');

const { createCanvas, loadImage } = require('canvas');
const canvas = createCanvas(500, 500);
const ctx = canvas.getContext('2d');

var multer = require('multer');
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
var upload = multer({ storage: storage });

app.get('/', (req, res) => {
  res.send('hello people');
});
app.listen(port, () => {
  console.log('listening to the port: ' + port);
});

app.post('/single', upload.single('testUpload'), (req, res) => {
  try {
    res.send(req.file);
    console.log(req.file.path);
    addUploadedImageToCanvas(req.file.path);
  } catch (err) {
    res.send(400);
  }
});

function addUploadedImageToCanvas(path) {
  const imageUpload = loadImage(path);
  console.log('here');
  console.log(imageUpload);
  let imageDataList = [];

  imageUpload
    .then((img) => {
      const imageWidth = img.width;
      const imageHeight = img.height;
      ctx.drawImage(img, 0, 0);
      imageDataList.push(ctx.getImageData(0, 0, imageWidth, imageHeight));

      ctx.beginPath();
      ctx.moveTo(75, 50);
      ctx.lineTo(100, 75);
      ctx.lineTo(100, 25);
      ctx.fill();
      imageDataList.push(ctx.getImageData(0, 0, img.width, img.height));

      const indexedColorImages = imageDataList.map((image) => {
        return convertImgDataToIndexedColorImage(image, 255);
      });

      writeGifData(imageWidth, imageHeight, indexedColorImages);
      writeDataToFile('assets/new.gif'); //TODO: write function to take original name and add .gif
    })
    .catch((err) => {
      console.log('oh no!', err);
    });
}

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
function writeGifData(imageWidth, imageHeight, indexedColorImages) {
  console.log('writing gif data');
  var gifWriter = new gw.GifWriter(outputStream);
  gifWriter.writeHeader();
  gifWriter.writeLogicalScreenInfo({
    width: imageWidth,
    height: imageHeight,
  });
  indexedColorImages.forEach((image) =>
    gifWriter.writeTableBasedImageWithGraphicControl(image, {
      delayTimeInMS: 500,
    })
  );
  gifWriter.writeTrailer();
}
// Write data to file. (node.js)
function writeDataToFile(newName) {
  console.log('writing data to file');
  var buf = Buffer.from(outputStream.buffer);
  fs.writeFile(`${newName}`, buf, function (err) {
    if (err) console.log(err);
    else console.log("It's saved!");
  });
}
