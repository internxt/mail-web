/* eslint-disable no-undef */

if (!/npm/.test(process.env.npm_execpath || '')) {
  console.error('\x1b[31m%s\x1b[0m', '✖ This project requires npm as the package manager.');
  console.error('\x1b[31m%s\x1b[0m', '  Please use: npm install');
  process.exit(1);
}
