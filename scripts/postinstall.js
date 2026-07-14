const C = {
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  green: "\x1b[32m"
};

// Clean block logo with correct vertical serif 'I' (45 characters wide)
const logo = `
▄▄▄▄▄▄▄ ▄▄▄▄▄▄▄ ▄▄▄▄▄▄▄ ▄▄▄▄▄▄▄ ▄▄▄▄▄ ▄▄▄▄▄▄▄
█ ▄ ▄ █ █ ▄▄▄▄█ █ ▄ ▄ █ █ ▄▄▄ █   █   █ ▄▄▄ █
█ █ █ █ █ ▄▄▄█▄ █ █ █ █ █ █▄█ █   █   █ ▄ ▄▄█
█▄█▀█▄█ █▄▄▄▄▄█ █▄█▀█▄█ █▄▄▄▄▄█ █▄▄▄█ █▄█▄▄▄█
`;

try {
  console.log(`${C.cyan}${logo}${C.reset}`);
  console.log(`  ${C.bold}Memoir NPC Memory SDK${C.reset} ${C.gray}v0.1.0${C.reset}`);
  console.log(`  ${C.gray}Powered by${C.reset} ${C.green}Supermemory Local${C.reset}\n`);
  console.log(`  ${C.bold}To start the memory engine run:${C.reset}`);
  console.log(`  ${C.cyan}npx supermemory local${C.reset}\n`);
} catch (e) {
  // Silent fallback
}
