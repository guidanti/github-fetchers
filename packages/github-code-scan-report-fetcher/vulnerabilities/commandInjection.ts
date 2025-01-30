import { exec } from 'child_process';

function listDirectory(dir: string) {
  // Vulnerable to Command Injection
  exec(`ls ${dir}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return;
    }
    console.log(`Stdout: ${stdout}`);
  });
}
