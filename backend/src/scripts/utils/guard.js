/**
 * Development-only guard for seed/clear scripts.
 * Never run against production data.
 */
function assertDevelopmentOnly() {
  const env = process.env.NODE_ENV || "development";
  if (env === "production") {
    throw new Error(
      "Refusing to run: NODE_ENV is production. Seeding is disabled in production."
    );
  }
  if (env !== "development" && process.env.ALLOW_SEED !== "true") {
    throw new Error(
      `Refusing to run: NODE_ENV=${env}. Set NODE_ENV=development or ALLOW_SEED=true (not recommended).`
    );
  }
}

function assertClearConfirmed() {
  if (process.argv.includes("--force")) return;
  if (process.env.SEED_CONFIRM === "YES") return;
  throw new Error(
    "Clear aborted. Set SEED_CONFIRM=YES or pass --force to wipe seed collections."
  );
}

module.exports = { assertDevelopmentOnly, assertClearConfirmed };
