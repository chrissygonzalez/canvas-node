var express = require('express');
const app = express();
const port = 8000;

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
  } catch (err) {
    res.send(400);
  }
});
