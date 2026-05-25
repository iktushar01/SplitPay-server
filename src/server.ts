import app from "./app";
import { envVars } from "./config/env";

// Load .env only in development
if (process.env.NODE_ENV !== "production") {
  import('dotenv/config');
}

const bootstrap = async () => {
  try {
    // Use process.env.PORT set by Railway, fallback to envVars or 5000
    const port = process.env.PORT || envVars.PORT || 5000;

    await app.listen(port);
    console.log(
      `✅ Server running on ${process.env.NODE_ENV || envVars.NODE_ENV} mode at http://localhost:${port}`
    );

  } catch (error: any) {
    if (error.code === "EADDRINUSE") {
      console.error(
        `❌ Port ${process.env.PORT || envVars.PORT} is already in use.`
      );
    } else {
      console.error("❌ Failed to start server:", error);
    }
  }
};

if (process.env.VERCEL !== "1") {
  bootstrap();
}

export default app;
