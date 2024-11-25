const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // Ensure userId is always present
    },
    balance: {                  
      type: Number,
      default: 0,
    },
    transaction: [
      {
        walletamount: {
          type: Number,
          default: 0,
        },
        orderId: {
          type: String,
          default: null, // Ensure consistent null values
        },
        transactionType: {
          type: String,
          enum: ["Credited", "Debited","null"], // Removed `null` from enum
        },
        transactionDate: {
          type: Date,
          default: Date.now,
        },
      },          
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Wallet", walletSchema);
