import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "./src/config/db.js";
import Workspace from "./src/models/Workspace.js";
import User from "./src/models/User.js";
import Wiki from "./src/models/Wiki.js";
import WikiVersion from "./src/models/WikiVersion.js";

const run = async () => {
  await connectDB();
  const workspace = await Workspace.findOne();
  if (workspace) {
    console.log("Workspace found:", workspace._id, workspace.name);
    const users = await User.find();
    console.log("Users found:", users.length);
  } else {
    console.log("No workspace found");
  }
  process.exit(0);
};

run();
