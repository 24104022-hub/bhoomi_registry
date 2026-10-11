import mongoose from "mongoose";

async function check() {
  const conn = await mongoose.connect("mongodb://127.0.0.1:27017");
  const admin = mongoose.connection.getClient().db().admin();
  const dbs = await admin.listDatabases();
  console.log("Databases:", dbs.databases.map(d => d.name));

  for (const dbName of ["bhoomi_registry", "bhoomi_land_registry"]) {
    const db = mongoose.connection.getClient().db(dbName);
    const collections = await db.listCollections().toArray();
    console.log(`\nCollections in ${dbName}:`, collections.map(c => c.name));
    if (collections.some(c => c.name === "users")) {
      const users = await db.collection("users").find({}).toArray();
      console.log(`Users in ${dbName} (${users.length}):`);
      users.forEach(u => console.log(` - email: ${u.email}, role: ${u.role}, pwHash: ${u.password?.slice(0, 15)}...`));
    }
  }

  await mongoose.disconnect();
}

check().catch(console.error);
