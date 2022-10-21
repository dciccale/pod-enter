#! /usr/bin/env node
import { promisify } from 'node:util';
import inquirer from 'inquirer';
import { exec, spawn } from 'child_process';

const execAsync = promisify(exec);
const spawnAsync = promisify(spawn);

const KUBECTL = 'kubectl';

const getPods = () =>
  execAsync(`${KUBECTL} get pods`).catch((err) => ({
    stdout: '',
    stderr: err
  }));

const shellInPod = (podName) =>
  spawnAsync(KUBECTL, ['exec', '-i', '-t', podName, '--', 'sh'], {
    stdio: 'inherit'
  });

(async () => {
  const { stdout, stderr } = await getPods();

  if (stderr) {
    console.log('Error executing command:');
    console.log(stderr);
    process.exit(1);
  }

  if (!stdout) {
    process.exit(0);
  }

  const lines = stdout.trim().split(/\n/);

  const header = lines[0];

  const choices = lines.slice(1).map((line) => {
    const parts = line.split(/\s{3,}/);
    const podName = parts[0];

    return {
      value: podName,
      name: line
    };
  });

  const questions = [
    {
      type: 'list',
      name: 'pod',
      message: `Choose a pod:\n${header}`,
      choices
    }
  ];

  const { pod } = await inquirer.prompt(questions);

  console.log(`Entering pod... ${pod}`);

  await shellInPod(pod);
})();
