const express = require("express");
const axios = require("axios");
const port = 4003;
const MongoDB = require("./mongo");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const redis = require("redis");
const publisher = redis.createClient();

MongoDB.connectDB((error) => {
  if (error) {
    console.log(error);
    process.exit(1); // Exit if connecion fails
  }
  // Connection successful
  console.log("Connection worked");
  const db = MongoDB.getDB();
  const inquiryCollection = db.collection("inquiries"); // Inquiries collection

  // not using this yet
  //   const imageCollection = db.collection('images'); // Images collection

  // Get inquiries endpoint
  app.get("/use/getInquiries", (req, res) => {
    // Network call
    inquiryCollection
      .find({})
      .toArray() // Convert documents found to JS array
      .then((inquiries) => {
        if (req.query.listingId) {
          // console.log(req.query.listingId);
          const found = inquiries.some(
            (inquiry) => inquiry.listingID == req.query.listingId
          );
          if (found) {
            let filterInquiries = inquiries.filter(
              (inquiry) => inquiry.listingID == req.query.listingId
            );
            // console.log(filterInquiries);
            res.send(filterInquiries);
          }
        }
      })
      .catch((e) => {
        console.log(e);
        res.send("Failed");
      });
  });
  app.post("/use/postInquiry", (req, res) => {
    const inquiry = {
      // todo: store username of the logged in user who sent the inquiry
      listingID: req.query.listingId,
      inquiryMessage: req.body.message,
      sender: req.body.sender,
      receiver: req.body.receiver,
    };
    console.log(inquiry.sender);
    console.log(inquiry.receiver);
    inquiryCollection
      .insertOne(inquiry)
      .then(() => {
        // Inquiry has been inserted
        res.send("Inquiry has been inserted");
        if (inquiry.receiver === "admin")
          publisher.publish("postInquirytoAdmin", JSON.stringify(inquiry));
        else publisher.publish("postInquirytoUser", JSON.stringify(inquiry));
      })
      .catch((e) => {
        console.log(e);
        res.send(e);
      });
  });
  // Get images endpoint
  // ASSUMING: Images have been processed and inserted into mongo collection
  // app.get('/api/getImages', (req, res) => {
  //   // Network call
  //   imageCollection
  //     .find({})
  //     .toArray() // Convert documents found to JS array
  //     .then((images) => {
  //       res.send(images);
  //     })
  //     .catch((e) => {
  //       console.log(e);
  //       res.send('Failed');
  //     });
  // });

  // // Post image endpoint, might have to be post not get
  // // ASSUMING: Images have been processed then sent to the endpoint
  // app.get('/postImage', (req, res) => {
  //   const processedImage = {
  //     imageID: req.query.id, // This would be the ID of the listing the image belongs to
  //     imageData: req.query.image, // This should(?) be the processed image data in base64
  //   };

  //   imageCollection
  //     .insertOne(prcessedImage)
  //     .then(() => {
  //       // Image has been inserted
  //       res.send('Image has been inserted');
  //     })
  //     .catch((e) => {
  //       console.log(e);
  //       res.send(e);
  //     });
  app.listen(port, console.log(`Inquiries server listening on port ${port}`));
});
// });
