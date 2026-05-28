export function initEnv() {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/schoolos?schema=public";
  }
  if (!process.env.BETTER_AUTH_SECRET) {
    process.env.BETTER_AUTH_SECRET = "dummy_secret_key_for_local_building_and_offline_testing_12345";
  }
}
