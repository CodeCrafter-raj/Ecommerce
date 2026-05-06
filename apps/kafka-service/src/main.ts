import kafka from "@packages/utils/kafka/index";
import { updateUserAnalytics } from "./services/analytics.service";
import { updateProductAnalytics } from "./services/analytics.service";

const consumer = kafka.consumer({
  groupId: "user-events-group",
});

const eventQueue: any[] = [];

const processQueue = async () => {
  if (eventQueue.length === 0) return;

  const events = [...eventQueue];
  eventQueue.length = 0;

  for (const event of events) {

    // Handle shop visit (you can update this later)
    if (event.action === "shop_visit") {
      // TODO: update shop analytics later
    }

    const validActions = [
      "add_to_wishlist",
      "remove_from_wishlist",
      "add_to_cart",
      "remove_from_cart",
      "product_view",
      "purchase",
      "shop_visit"
    ];

    if (!event.action || !validActions.includes(event.action)) {
      continue;
    }

    try {
      // Update user-level analytics
      await updateUserAnalytics(event);

      // Update product-level analytics
      await updateProductAnalytics(event);

    } catch (error) {
      console.log("Error processing analytics:", error);
    }
  }
};

setInterval(processQueue, 3000); // Run queue processor every 3 sec

// Kafka consumer
export const consumerKafkaMessages = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: "user-events", fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      try {
        const event = JSON.parse(message.value.toString());
        eventQueue.push(event);

        // Prevent eventQueue from growing unbounded
        if (eventQueue.length > 5000) {
          eventQueue.shift();
        }

      } catch (err) {
        console.log("Invalid JSON in Kafka event:", err);
      }
    },
  });
};

consumerKafkaMessages().catch(console.error);













// import { kafka } from "@packages/utils/kafka/index";
// import { updateUserAnalytics } from "./services/analytics.service";

// const consumer = kafka.consumer({
//   groupId: "user-events-group",
// });

// const eventQueue: any[] = [];

// const processQueue = async () => {
//   if (eventQueue.length === 0) {
//     return;

//   }

//   const events = [...eventQueue];

//   eventQueue.length = 0;

//   for (const event of events) {
//     if (event.action === "shop_visit") {
//       //update shop analytics



//     }
//     const validActions = [
//       "add_to_wishlist",
//       "remove_from_wishlist",
//       "add_to_cart",
//       "remove_from_cart",
//       "product_view"
//     ];
//     if (!event.action || !validActions.includes(event.action)) {
//       //console.log("Invalid event action");
//       continue;
//     }

//     try {

//       await updateUserAnalytics(event);

//     } catch (error) {
//       console.log("Error updating user analytics", error);
//     }
//   }
// };

// setInterval(processQueue, 3000);//3 sec

// //kafka consumer for user events
// export const consumerKafkaMessages = async () => {
//   //connect to kafka
//   await consumer.connect();

//   //subscribe to topic
//   await consumer.subscribe({ topic: "user-events", fromBeginning: false });

//   //start consuming messages
//   await consumer.run({
//     eachMessage: async ({ message }) => {
//       if (!message.value) {
//         return;
//       }
//       const event = JSON.parse(message.value.toString());
//       eventQueue.push(event);
//     },
//   });

// };

// consumerKafkaMessages().catch(console.error);

