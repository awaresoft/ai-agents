import { Command } from "commander";
import { buildCommand } from "./commands/build.ts";
import { syncCommand } from "./commands/sync.ts";

const program = new Command()
  .name("agents")
  .description("Unified agent & skill orchestration CLI")
  .version("1.0.0");

program.addCommand(buildCommand);
program.addCommand(syncCommand);

program.parse();
