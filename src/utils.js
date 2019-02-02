import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import pf from 'portfinder';
import envPaths from 'env-paths';

let configPath = '';
let configFileName = 'sqlectron.json';
let envPathName = 'Sqlectron';

export function init({
  fileName,
  envName
}) {
  configFileName = fileName
  envPathName = envName
}

export function getConfigPath() {
  if (configPath) {
    return configPath;
  }

  const oldConfigPath = path.join(homedir(), `.${configFileName}`);

  if (fileExistsSync(oldConfigPath)) {
    configPath = oldConfigPath;
  } else {
    const newConfigDir = envPaths(envPathName, { suffix: '' }).config;
    configPath = path.join(newConfigDir, configFileName);
  }

  return configPath;
}


export function homedir() {
  return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
}


export function fileExists(filename) {
  return new Promise((resolve) => {
    fs.stat(filename, (err, stats) => {
      if (err) return resolve(false);
      resolve(stats.isFile());
    });
  });
}


export function fileExistsSync(filename) {
  try {
    return fs.statSync(filename).isFile();
  } catch (e) {
    return false;
  }
}


export function writeFile(filename, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, data, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}


export function writeJSONFile(filename, data) {
  return writeFile(filename, JSON.stringify(data, null, 2));
}


export function writeJSONFileSync(filename, data) {
  return fs.writeFileSync(filename, JSON.stringify(data, null, 2));
}


export function readFile(filename) {
  const filePath = resolveHomePathToAbsolute(filename);
  return new Promise((resolve, reject) => {
    fs.readFile(path.resolve(filePath), (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
}


export function readJSONFile(filename) {
  return readFile(filename).then((data) => JSON.parse(data));
}


export function readJSONFileSync(filename) {
  const filePath = resolveHomePathToAbsolute(filename);
  const data = fs.readFileSync(path.resolve(filePath), { encoding: 'utf-8' });
  return JSON.parse(data);
}

export function createParentDirectory(filename) {
  return new Promise((resolve, reject) =>
    (mkdirp(path.dirname(filename), (err) => (err ? reject(err) : resolve())))
  );
}

export function createParentDirectorySync(filename) {
  mkdirp.sync(path.dirname(filename));
}


export function resolveHomePathToAbsolute(filename) {
  if (!/^~\//.test(filename)) {
    return filename;
  }

  return path.join(homedir(), filename.substring(2));
}


export function getPort() {
  return new Promise((resolve, reject) => {
    pf.getPort({ host: 'localhost' }, (err, port) => {
      if (err) return reject(err);
      resolve(port);
    });
  });
}

export function createCancelablePromise(error, timeIdle = 100) {
  let canceled = false;
  let discarded = false;

  const wait = (time) => new Promise((resolve) => setTimeout(resolve, time));

  return {
    async wait() {
      while (!canceled && !discarded) {
        await wait(timeIdle);
      }

      if (canceled) {
        const err = new Error(error.message || 'Promise canceled.');

        Object.getOwnPropertyNames(error)
          .forEach((key) => err[key] = error[key]); // eslint-disable-line no-return-assign

        throw err;
      }
    },
    cancel() {
      canceled = true;
    },
    discard() {
      discarded = true;
    },
  };
}
