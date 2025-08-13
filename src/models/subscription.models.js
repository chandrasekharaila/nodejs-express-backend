import mongoose, { Schema } from "mongoose";

const subscriptionSchema = Schema(
  {
    subscriber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timeStamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
