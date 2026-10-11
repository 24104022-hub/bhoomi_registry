import mongoose from "mongoose";

function normalizeURI(rawUri) {
  let uri = (rawUri || "mongodb://127.0.0.1:27017/bhoomi_land_registry").trim();
  const qIdx = uri.indexOf("?");
  const base = qIdx !== -1 ? uri.slice(0, qIdx) : uri;
  const query = qIdx !== -1 ? uri.slice(qIdx) : "";
  const schemeIdx = base.indexOf("://");

  if (schemeIdx !== -1) {
    const afterScheme = base.slice(schemeIdx + 3);
    const slashIdx = afterScheme.indexOf("/");
    if (slashIdx === -1 || slashIdx === afterScheme.length - 1) {
      return `${base.replace(/\/+$/, "")}/bhoomi_land_registry${query}`;
    }
  }
  return uri;
}

export async function connectDB() {
  const mongoURI = normalizeURI(process.env.MONGO_STRING);
  
  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    // If connecting to localhost failed (e.g. IPv6 ::1 issue on Windows), retry with 127.0.0.1
    if (mongoURI.includes("localhost")) {
      const ipv4URI = mongoURI.replace("localhost", "127.0.0.1");
      try {
        console.log(`[MongoDB] Retrying with IPv4 fallback (${ipv4URI})...`);
        const conn = await mongoose.connect(ipv4URI, {
          serverSelectionTimeoutMS: 5000,
        });
        console.log(`[MongoDB] Connected successfully via IPv4: ${conn.connection.host}, database: ${conn.connection.name}`);
        return conn;
      } catch {
        /* proceed to error log */
      }
    }

    console.error(`[MongoDB Connection Error] Failed connecting to ${mongoURI}`);
    console.error(`Reason: ${error.message}`);
    console.log(`[MongoDB Guidance] Make sure MongoDB Server is running on port 27017, or set MONGO_STRING in backend/.env to your MongoDB Atlas cloud URI.`);
    // Do not crash the entire process immediately so error diagnostics or recovery can be handled
    return null;
  }
}

mongoose.connection.on("disconnected", () => {
  console.warn("[MongoDB] Disconnected from database.");
});

mongoose.connection.on("reconnected", () => {
  console.log("[MongoDB] Reconnected to database.");
});
