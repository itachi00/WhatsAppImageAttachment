const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const admin = require('firebase-admin');

const app = express();
const port = process.env.PORT || 5020;

// Parse incoming requests (x-www-form-urlencoded)
app.use(bodyParser.urlencoded({ extended: false }));

// Load the Firebase Admin SDK credentials
const serviceAccount = require('./firebase-adminsdk.json');

// Initialize the Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://whatsappimageattachment.firebaseio.com" 
});

// Initialize Firestore
const db = admin.firestore();

// Twilio webhook endpoint
app.post('/whatsapp/webhook', async (req, res) => {
    const numMedia = req.body.NumMedia || 0;
    const senderWaId = req.body.WaId;  // WhatsApp ID of the sender
    const twiml = new twilio.twiml.MessagingResponse();

    if (numMedia > 0) {
        // Loop through media files if there are multiple
        const mediaUrls = [];
        for (let i = 0; i < numMedia; i++) {
            const mediaUrl = req.body[`MediaUrl${i}`];
            mediaUrls.push(mediaUrl);
        }

        // Save the media URLs to Firestore along with sender's WaId
        try {
            await db.collection('whatsappMedia').add({
                senderWaId: senderWaId,
                mediaUrls: mediaUrls,
                uploadedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`Saved media from WaId ${senderWaId}: ${mediaUrls}`);

            // Respond to WhatsApp with a thank you message
            twiml.message('Thanks for sending the image(s)!');
        } catch (error) {
            console.error('Error saving media URL to Firestore:', error);
            twiml.message('There was an error saving your image.');
        }
    } else {
        // Handle text received
        const message = req.body.Body;
        console.log(`Received message from ${senderWaId}: ${message}`);
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


// Route to fetch the recent 5 images for a given WaId
app.get('/whatsapp/images/:waId', async (req, res) => {
    const senderWaId = req.params.waId;

    try {
        // Query Firestore for the 5 most recent media URLs from the given WaId
        const mediaQuerySnapshot = await db.collection('whatsappMedia')
            .where('senderWaId', '==', senderWaId)
            .orderBy('uploadedAt', 'desc')
            .limit(5)
            .get();

        const mediaUrls = [];
        mediaQuerySnapshot.forEach((doc) => {
            mediaUrls.push(doc.data().mediaUrls);
        });

        if (mediaUrls.length > 0) {
            // Flatten the array in case each entry has multiple media URLs
            const flattenedUrls = [].concat(...mediaUrls);
            res.status(200).json({ urls: flattenedUrls });
        } else {
            res.status(404).send('No media found for this WaId');
        }
    } catch (error) {
        console.error('Error fetching media URLs:', error);
        res.status(500).send('Error fetching media URLs');
    }
});
