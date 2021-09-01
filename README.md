<h1 style="text-align: center">config-discovery</h1>
<div style="text-align:center; align-content: center;">
    <a href="https://github.com/SiegfredRodriguez/config-discovery/actions/workflows/node.js.yml"><img alt="Unit test status" src="https://github.com/SiegfredRodriguez/config-discovery/actions/workflows/node.js.yml/badge.svg?style=flat-square" /></a>
    <a href="https://app.codecov.io/gh/SiegfredRodriguez/config-discovery"><img alt="Codecov" src="https://img.shields.io/codecov/c/github/SiegfredRodriguez/config-discovery?style=flat-square" /></a>
    <a href="https://github.com/SiegfredRodriguez/config-discovery/blob/master/LICENSE"><img alt="GitHub" src="https://img.shields.io/github/license/SiegfredRodriguez/config-discovery?style=flat-square" /></a>
    <a href="https://www.npmjs.com/package/config-discovery"><img alt="npm" src="https://img.shields.io/npm/v/config-discovery?style=flat-square" /></a>
</div>

### What is it?

A simple JSON configuration loading utility.

### What does it allow you to do ?

- Look for a configuration file from a list of possible locations, and load the first one.
- Create a composite configuration using patches from another config file or from the environment.

### Why did you make this ?

This utility was built with containerizing backend NodeJS applications in mind. Configuration setups in containers
almost always involve the use of K8s ConfigMaps and Secrets, which are mounted either as a file and/or as environment
variables, config-discovery takes care of locating and compositing these configurations into a single json object for
you.

## Sample usage

### Scenario 1: Simply load config outside the

```javascript
let Config = require('config-discovery');

...

let configuration = new Config()
    .fromFile('/configs/config.json')
    .get();

const knex = Knex(configuration)
```

### Scenario 2: Prioritize a configuration based on location.
This will load the first configuration it finds, starting from fromFile().
```javascript
let Config = require('config-discovery');

...

let configuration = new Config()
    .fromFile('/configs/config.json')
    .or('/configuration/config.json')
    .or('/etc/my_configs/config.json')
    .get();

const knex = Knex(configuration)
```

### Scenario 2: Composite a configuration.
This happens when sensitive data are provided with K8S Secrets, which can be mounted as environment variable, or as a file. 
```javascript
let Config = require('config-discovery');

...

let envPrototype = { connection: { user: 'SECRET_DB_USERNAME', password: 'SECRET_DB_PASSWORD'} };

let configuration = new Config()
    .fromFile('/configs/config.json')
    .or('/configuration/config.json')
    .or('/etc/my_configs/config.json')
    .thenPatchWith()
    .patchWithEnv(prototype)
    .get();

const knex = Knex(configuration)
```
Or patch with another file.
```javascript
let Config = require('config-discovery');

...

let envPrototype = { connection: { user: 'SECRET_DB_USERNAME', password: 'SECRET_DB_PASSWORD'} };

let configuration = new Config()
    .fromFile('/configs/config.json')
    .or('/configuration/config.json')
    .or('/etc/my_configs/config.json')
    .thenPatchWith()
    .configFile('/var/secrets.json')
    .get();

const knex = Knex(configuration)
```