let Denque = require('denque')
let fs = require('fs');

const SourceType = Object.seal({
    PATH: 'path',
    ENV_PROTOTYPE: 'ENV_PROTOTYPE'
});

function ConfigChain(configName, options = {parser: JSON.parse}) {
    this.meta = {configName: configName, parser: options.parser}
    this.meta.configQueue = new Denque();

    this.compositeOf = _compositeOf.bind(this);
    this.monolithOf = _monolithOf.bind(this);

    return this;
}

function _monolithOf(source, options = {type: SourceType.PATH}) {
    this.meta.isComposite = false;

    let value = undefined;

    if (options.type === SourceType.PATH) {
        value = source;
    } else {
        value = _pullEnvironmentPrototype(source);
    }

    this.meta.configQueue.push(value);

    this.or = _nextDirectory.bind(this);
    this.load = _loadFirstFound.bind(this);

    delete this.compositeOf;
    delete this.monolithOf;

    return this;
}

function _compositeOf(source, options = {overrideOldFields: true, type: SourceType.PATH}) {
    this.meta.isComposite = true;
    this.meta.overrideOldFields = options.overrideOldFields;

    let value = undefined;

    if (options.type === SourceType.PATH) {
        value = source;
    } else {
        value = _pullEnvironmentPrototype(source);
    }

    this.meta.configQueue.push(value);

    this.and = _nextDirectory.bind(this);
    this.load = _composeConfig.bind(this);

    delete this.compositeOf;
    delete this.monolithOf;

    return this;
}

function _nextDirectory(source, options = {type: SourceType.PATH}) {

    let value = undefined;

    if (options.type === SourceType.PATH) {
        value = source;
    } else {
        value = _pullEnvironmentPrototype(source);
    }

    this.meta.configQueue.push(value);

    return this;
}


function _composeConfig(defaultConfig = {}) {

    const {configQueue, configName, overrideOldFields, parser} = this.meta;

    let nextSource = overrideOldFields ? configQueue.shift.bind(configQueue) : configQueue.pop.bind(configQueue);

    let result = {};

    while (!configQueue.isEmpty()) {

        let source = nextSource();
        let configValue = source;

        if (typeof source === 'string') {
            let filePath = `${source}/${configName}`;

            if (!fs.existsSync(filePath)) {
                continue;
            }

            configValue = parser(fs.readFileSync(filePath))
        }

        _mergeConfigs(result, configValue);
    }

    return (Object.keys(result).length > 0) ? result : defaultConfig;
}

function _loadFirstFound(defaultConfig = {}) {

    const {configQueue, configName, parser} = this.meta;
    let nextPath = configQueue.shift.bind(configQueue);

    let result = {};

    while (!configQueue.isEmpty()) {
        let filePath = `${nextPath()}/${configName}`;

        if (!fs.existsSync(filePath)) {
            continue;
        }

        result = parser(fs.readFileSync(filePath))
        break;
    }

    return (Object.keys(result).length > 0) ? result : defaultConfig;
}

function _mergeConfigs(target, source) {

    Object.keys(source).forEach(key => {
        target[key] = source[key];
    });

    return target;
}

function _pullEnvironmentPrototype(prototype) {
    let result = {};

    Object.keys(prototype)
        .forEach(key => result[key] = process.env[prototype[key]]);

    return result
}

module.exports.ConfigChain = ConfigChain
module.exports.SourceType = SourceType;