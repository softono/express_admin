const isProduction = process.env.NODE_ENV === "production";

module.exports = {
  apps: [
    {
      name: isProduction ? "express-admin-api" : "express-admin-api-dev",
      script: "node_modules/tsx/dist/cli.mjs",
      args: isProduction
        ? "--env-file=.env src/server.ts"
        : "watch --env-file=.env src/server.ts",
      env: {
        NODE_ENV: process.env.NODE_ENV || "development",
      },
    },
  ],
};
