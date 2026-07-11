const mongoose = require("mongoose");
require("dotenv").config();

const Role = require("./models/Role");
const Permission = require("./models/Permission");
const User = require("./models/User");
const bcrypt = require("bcrypt");

const permissionsList = [
  "CREATE_MOVIE",
  "UPDATE_MOVIE",
  "DELETE_MOVIE",
  "VIEW_MOVIES",
  "CREATE_EVENT",
  "UPDATE_EVENT",
  "DELETE_EVENT",
  "VIEW_EVENTS",
  "MANAGE_ROLES",
  "MANAGE_PERMISSIONS",
  "ADD_TO_WATCHLIST",
  "REMOVE_FROM_WATCHLIST",
  "VIEW_WATCHLIST",
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const permissions = [];

    for (const name of permissionsList) {
      let perm = await Permission.findOne({ name });

      if (!perm) {
        perm = await Permission.create({ name });
        console.log(`Permission created → ${name}`);
      }

      permissions.push(perm);
    }

    const perms = {};
    permissions.forEach(p => {
      perms[p.name] = p._id;
    });

    const roles = [
      {
        name: "admin",
        permissions: permissions.map(p => p._id)
      },
      {
        name: "manager",
        permissions: [
          perms.CREATE_MOVIE,
          perms.UPDATE_MOVIE,
          perms.DELETE_MOVIE,
          perms.VIEW_MOVIES,
          perms.CREATE_EVENT,
          perms.UPDATE_EVENT,
          perms.DELETE_EVENT,
          perms.VIEW_EVENTS,
          perms.ADD_TO_WATCHLIST,
          perms.REMOVE_FROM_WATCHLIST,
          perms.VIEW_WATCHLIST
        ]
      },
      {
        name: "user",
        permissions: [
          perms.VIEW_MOVIES,
          perms.VIEW_EVENTS,
          perms.ADD_TO_WATCHLIST,
          perms.REMOVE_FROM_WATCHLIST,
          perms.VIEW_WATCHLIST
        ]
      }
    ];

    for (const roleData of roles) {
    const existingRole = await Role.findOne({ name: roleData.name });

    if (!existingRole) {
      await Role.create(roleData);
      console.log(`Role created → ${roleData.name}`);
    } else {
      existingRole.permissions = roleData.permissions;
      await existingRole.save();

      console.log(`Role updated → ${roleData.name}`);
    }
  }

    const adminEmail = "admin.moviematrix@gmail.com";
    const adminPassword = "Admin@MovieMatrix2025";
    const adminRole = await Role.findOne({ name: "admin" });

    const adminExists = await User.findOne({ email: adminEmail });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      await User.create({
        username: "Movie Matrix",
        email: adminEmail,
        password: hashedPassword,
        role: adminRole._id
      });

      console.log(
        `Default admin user created → ${adminEmail} / ${adminPassword}`
      );
    } else {
      console.log("Admin user already exists");
    }

    console.log("RBAC Seeding Completed Successfully");
    process.exit();

  } catch (error) {
    console.error("RBAC Seeding Error:", error);
    process.exit(1);
  }
}

seed();