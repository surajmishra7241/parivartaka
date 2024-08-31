const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const PDFDocument = require('pdfkit');
const { v4: uuidv4 } = require('uuid');

const app = express();
const upload = multer({ dest: 'uploads/' });

const PORT = 3000;

// Utility function to send file and delete after response
const sendFileAndDelete = (res, filePath, mimeType) => {
  console.log(`Sending file: ${filePath}`);
  res.setHeader('Content-Type', mimeType);
  res.sendFile(filePath, err => {
    if (err) {
      console.error('Error sending file:', err.message);
    } else {
      fs.unlink(filePath, err => {
        if (err) {
          console.error('Error deleting file:', err.message);
        } else {
          console.log('File deleted successfully');
        }
      });
    }
  });
};

// Convert JPEG to PNG
app.post('/convert/jpeg-to-png', upload.single('file'), (req, res) => {
  const file = req.file;
  if (!file) {
    console.error('No file uploaded');
    return res.status(400).send('No file uploaded');
  }

  const outputFilePath = path.join('uploads', `${uuidv4()}.png`);

  console.log(`Converting JPEG to PNG: ${file.path}`);
  exec(`magick ${file.path} ${outputFilePath}`, (error) => {
    if (error) {
      console.error('Error during conversion:', error.message);
      return res.status(500).send('Conversion failed');
    }

    sendFileAndDelete(res, outputFilePath, 'image/png');
  });
});

// Convert PNG to JPEG
app.post('/convert/png-to-jpeg', upload.single('file'), (req, res) => {
  const file = req.file;
  if (!file) {
    console.error('No file uploaded');
    return res.status(400).send('No file uploaded');
  }

  const outputFilePath = path.join('uploads', `${uuidv4()}.jpeg`);

  console.log(`Converting PNG to JPEG: ${file.path}`);
  exec(`magick ${file.path} ${outputFilePath}`, (error) => {
    if (error) {
      console.error('Error during conversion:', error.message);
      return res.status(500).send('Conversion failed');
    }

    sendFileAndDelete(res, outputFilePath, 'image/jpeg');
  });
});

// Convert JPEG to PDF
app.post('/convert/jpeg-to-pdf', upload.single('file'), (req, res) => {
  const file = req.file;
  if (!file) {
    console.error('No file uploaded');
    return res.status(400).send('No file uploaded');
  }

  const outputFilePath = path.join('uploads', `${uuidv4()}.pdf`);

  console.log(`Converting JPEG to PDF: ${file.path}`);
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(outputFilePath));
  doc.image(file.path, 0, 0, { fit: [600, 800], align: 'center', valign: 'center' });
  doc.end();

  sendFileAndDelete(res, outputFilePath, 'application/pdf');
});

// Convert Text to PDF
app.post('/convert/text-to-pdf', upload.single('file'), (req, res) => {
  const file = req.file;
  if (!file) {
    console.error('No file uploaded');
    return res.status(400).send('No file uploaded');
  }

  const outputFilePath = path.join('uploads', `${uuidv4()}.pdf`);

  console.log(`Converting Text to PDF: ${file.path}`);
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(outputFilePath));
  doc.font('Times-Roman').fontSize(12).text(fs.readFileSync(file.path, 'utf8'), { align: 'justify' });
  doc.end();

  sendFileAndDelete(res, outputFilePath, 'application/pdf');
});

// Convert Word to PDF
app.post('/convert/word-to-pdf', upload.single('file'), (req, res) => {
  const file = req.file;
  if (!file) {
    console.error('No file uploaded');
    return res.status(400).send('No file uploaded');
  }

  const outputFilePath = path.join('uploads', `${uuidv4()}.pdf`);

  console.log(`Converting Word to PDF: ${file.path}`);
  exec(`libreoffice --headless --convert-to pdf --outdir uploads ${file.path}`, (error) => {
    if (error) {
      console.error('Error during conversion:', error.message);
      return res.status(500).send('Conversion failed');
    }

    sendFileAndDelete(res, outputFilePath, 'application/pdf');
  });
});

// Error handling for file deletion
app.use((err, req, res, next) => {
  console.error('An error occurred:', err.message);
  res.status(500).send('Internal Server Error');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
