let Denque = require('denque');
let fs = require('fs');

function ConfigChain(configName, options = {parser: JSON.parse}) {
    this.meta = {configName: configName, parser: options.parser}
    this.meta.pathQueue = new Denque();

    this.compositeOf = _compositeOf.bind(this);
    this.monolithOf = _monolithOf.bind(this);

    return this;
}

function _monolithOf(directoryName, options = {}) {
    this.meta.isComposite = false;
    this.meta.pathQueue.push(directoryName);

    this.or = _nextDirectory.bind(this);
    this.load = _loadFirstFound.bind(this);

    delete this.compositeOf;
    delete this.monolithOf;

    return this;
}

function _compositeOf(directoryName, options = {overrideOldFields: true}) {
    this.meta.isComposite = true;
    this.meta.overrideOldFields = options.overrideOldFields;
    this.meta.pathQueue.push(directoryName);

    this.and = _nextDirectory.bind(this);
    this.load = _composeConfig.bind(this);

    delete this.compositeOf;
    delete this.monolithOf;

    return this;
}

function _nextDirectory(directoryName) {
    this.meta.pathQueue.push(directoryName);
    return this;
}

function _composeConfig(defaultConfig = {}) {

    const {pathQueue, configName, overrideOldFields, parser} = this.meta;

    let nextPath = overrideOldFields ? pathQueue.shift.bind(pathQueue) : pathQueue.pop.bind(pathQueue);

    let result = {};

    while (!pathQueue.isEmpty()) {
        let filePath = `${nextPath()}/${configName}`;

        if (!fs.existsSync(filePath)) {
            continue;
        }

        _mergeConfigs(result, parser(fs.readFileSync(filePath)));
    }

    return (Object.keys(result) > 0) ? result : defaultConfig;
}

function _loadFirstFound(defaultConfig = {}) {

    const {pathQueue, configName, parser} = this.meta;
    let nextPath = pathQueue.shift.bind(pathQueue);

    let result = {};

    while (!pathQueue.isEmpty()) {
        let filePath = `${nextPath()}/${configName}`;

        if (!fs.existsSync(filePath)) {
            continue;
        }

        result = parser(fs.readFileSync(filePath))
        break;
    }

    return (Object.keys(result) > 0) ? result : defaultConfig;
}

function _mergeConfigs(target, source) {

    Object.keys(source).forEach(key => {
        target[key] = source[key];
    });

    return target;
}


module.exports.ConfigChain = ConfigChain
