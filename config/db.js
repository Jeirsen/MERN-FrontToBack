const mongoose = require("mongoose");
const config = require("config");
const db = config.get("mongoURI");

const connectDB = async () => {
  try {
    await mongoose.connect(db, {
      useNewUrlParser: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
      useCreateIndex: true,
    });
    console.log("MONGODB connected");
  } catch (error) {
    console.log(error.message);
    // exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;
