import {umzug} from "./migration-manager.mjs";

try {
    await umzug.up()
} catch (error) {
    console.error("Error running migrations:", error);
    process.exit(1);
}