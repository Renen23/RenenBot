import fs from "node:fs";
import { getNextKitten, menuMessage } from "../menu.js";

const generalCommands = [
  {
    name: "menu",
    level: "admin",
    commands: ["menu", "help", "comandos"],
    description: "Mostra o menu de comandos.",
    async handle({ sender }) {
      let imagePath = getNextKitten();

      if (!fs.existsSync(imagePath)) {
        await sender.sendReply(`\n\n${menuMessage()}`);
        return;
      }

      await sender.sendImageFromFile(imagePath, `\n\n${menuMessage()}`);
    },
  },
  {
    name: "ping",
    level: "admin",
    commands: ["ping"],
    description: "Verifica se o bot está online.",
    async handle({ sender }) {
      await sender.sendReply("🏓 Pong!");
    },
  },
];

export { generalCommands };
