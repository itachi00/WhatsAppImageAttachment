const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');

const app = express();
const port = process.env.PORT || 3000;

// Parse incoming requests (x-www-form-urlencoded)
app.use(bodyParser.urlencoded({ extended: false }));

// Twilio webhook endpoint
app.post('/whatsapp/webhook', (req, res) => {
    const numMedia = req.body.NumMedia || 0;
    const twiml = new twilio.twiml.MessagingResponse();

    // Make sure to only respond once
    if (numMedia > 0) {
        // Handle media received
        const mediaUrl = req.body.MediaUrl0;
        console.log(`Received media: ${mediaUrl}`);
        twiml.message('Thanks for sending the image!');
    } else {
        // Handle text received
        const message = req.body.Body;
        console.log(`Received message: ${message}`);
        twiml.message('Thanks for the message!');
    }

    // Make sure we respond only once
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
});

// Start the server
app.listen(port, () => {
    console.log(`Express server running on port ${port}`);
});
