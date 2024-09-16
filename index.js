const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const twilio = require('twilio');
const MessagingResponse = twilio.twiml.MessagingResponse;

const port = process.env.PORT || 3000;

// Parse incoming requests
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Twilio Webhook endpoint
app.get('/whatsapp/webhook', (req, res) => {
    const numMedia = req.body.NumMedia;
    const twiml = new MessagingResponse();

    if (numMedia > 0) {
        // If media is attached, get the Media URL from the request
        const mediaUrl = req.body.MediaUrl0;
        console.log('Received Media:', mediaUrl);

        // Respond back with a message acknowledging receipt
        const message = twiml.message('Thank you for the image!');
        message.media(mediaUrl);  // Optionally send the image back
    } else {
        // Respond to text message
        twiml.message('Hello! You sent a text message.');
    }

    // Send the TwiML response back to Twilio
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
