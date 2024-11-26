const User=require('../../model/userSchema')
const Wallet=require('../../model/walletSchema');

exports.getwallet = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const skip = (page - 1) * limit;

    const userId = req.session.user._id;
    console.log('user id',userId)

    // Find wallet and handle transactions pagination manually
    const walletItems = await Wallet.findOne({ userId });

    if (!walletItems) {
      return res.status(404).send("Wallet not found");
    }

    const totalTransaction = walletItems.transaction.length;
    const paginatedTransactions = walletItems.transaction.slice(skip, skip + limit);
    const totalPages = Math.ceil(totalTransaction / limit);
    

    res.render("user/wallet", {
      walletItems: {
        ...walletItems.toObject(),
        transaction: paginatedTransactions, // Replace transactions with paginated ones
      },
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    console.error("Error fetching wallet data:", error);
    res.status(500).send("Server error");
  }
};
