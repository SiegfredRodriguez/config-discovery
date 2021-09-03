let fs = require('fs');

class Config {
    #meta;

    constructor(options = {parser: JSON.parse}) {
        this.#meta = {config: {}, parser: options.parser};
    }

    /**
     * Will try to load initial config from provided
     * absolutePath. If config file is not found, it does nothing.
     *
     * @param absolutePath Possible location of a configuration file
     * @returns FindFirstConfigProvider
     */
    fromFile(absolutePath) {
        const {parser} = this.#meta;
        let object = {};

        if (fs.existsSync(absolutePath)) {
            let byteData = fs.readFileSync(absolutePath);
            object = parser(byteData);
        }

        return this.fromObject(object);
    }

    /**
     * Will try to load initial config from the environment based
     * on provided prototype. If prototype is not satisfied it does.
     * nothing.
     *
     * @param prototype Prototype for an object to generate from the ENV
     * @returns FindFirstConfigProvider
     */
    fromEnv(prototype) {
        let object = {};

        if (_isDefinedNonNull(prototype) && _isNotEmpty(prototype)) {
            object = _pullEnvironmentPrototype(prototype);
        }

        return this.fromObject(object);
    }

    /**
     * Will try to load initial config from provided object,
     * if jsonObject is empty or not valid, will ignore.
     *
     * @param jsonObject A possibly non empty object
     * @returns FindFirstConfigProvider
     */
    fromObject(jsonObject) {
        const {config} = this.#meta;

        if (_isDefinedNonNull(jsonObject) && _isNotEmpty(jsonObject)) {
            _mergeConfigs(config, jsonObject);
            this.#meta.foundFirst = true;
        }

        let metadata = this.#meta;
        this.#meta = undefined;
        return new FindFirstConfigProvider(metadata);
    }
}

class FindFirstConfigProvider {
    #meta

    constructor(meta) {
        this.#meta = meta;
    }

    /**
     * Will try to load configuration from absolutePath if the previous
     * attempts from from*() or another or*() failed.
     * @param absolutePath Possible location of a configuration file
     * @returns FindFirstConfigProvider
     */
    or(absolutePath) {
        const {config, parser, foundFirst} = this.#meta;

        if (!foundFirst) {
            if (fs.existsSync(absolutePath)) {
                let byteData = fs.readFileSync(absolutePath);
                let object = parser(byteData);

                _mergeConfigs(config, object);

                this.#meta.foundFirst = true;
            }
        }

        return this;
    }

    /**
     * Will try to load configuration from absolutePath if the previous
     * attempts from from*() or another or*() failed.
     * @param absolutePath Possible location of a configuration file
     * @returns FindFirstConfigProvider
     */
    orFile(absolutePath) {
        const {parser, foundFirst} = this.#meta;

        if (!foundFirst) {
            if (fs.existsSync(absolutePath)) {
                let byteData = fs.readFileSync(absolutePath);
                let object = parser(byteData);
                this.orObject(object);
            }
        }

        return this;
    }

    /**
     * Will try to load configuration from environment
     * based on provided prototype if the previous
     * attempts from from*() or another or*() failed.
     * @param prototype Prototype for an object to generate from the ENV
     * @returns FindFirstConfigProvider
     */
    orEnv(prototype) {
        const {foundFirst} = this.#meta;

        if (!foundFirst) {
            if (_isDefinedNonNull(prototype) && _isNotEmpty(prototype)) {
                let object = _pullEnvironmentPrototype(prototype);
                this.orObject(object);
            }
        }

        return this;
    }

    /**
     * Will try to load configuration from provided object if the previous
     * attempt from from*() or another or*() failed.
     * @param jsonObject A possibly non empty jsonObject
     * @returns FindFirstConfigProvider
     */
    orObject(jsonObject) {
        const {config, foundFirst} = this.#meta;

        if (!foundFirst) {
            if (_isDefinedNonNull(jsonObject) && _isNotEmpty(jsonObject)) {
                _mergeConfigs(config, jsonObject);
                this.#meta.foundFirst = true;
            }
        }

        return this;
    }

    /**
     * Marks the transition from finding first config to
     * patching current config from another config file
     * or config assembled from the environment.
     * @returns PatchingConfigProvider
     */
    thenPatchWith() {
        let metadata = this.#meta;
        this.#meta = undefined;
        return new PatchingConfigProvider(metadata);
    }

    /**
     * Will return the configuration.
     * @returns JSON
     */
    get() {
        return this.#meta.config;
    }
}

class PatchingConfigProvider {
    #meta

    constructor(meta) {
        this.#meta = meta;
    }

    /**
     * Will try to load specified config file,
     * and override any existing config key, and append non existing ones.
     * @param absolutePath Possible location of a configuration file
     * @returns PatchingConfigProvider
     */
    configFile(absolutePath) {
        const {config, parser} = this.#meta;

        if (fs.existsSync(absolutePath)) {
            let byteData = fs.readFileSync(absolutePath);
            let object = parser(byteData);

            _mergeConfigs(config, object);

            this.#meta.foundFirst = true;
        }

        return this;
    }

    /**
     * Will try to *assemble* a config based from provided prototype object,
     * and override any existing config key, and append non existing ones.
     *
     *  Currently only support string valued ENV_VARS (no structure data value support yet).
     *
     *  PROTOTYPE format:
     *  {
     *      jsonKey1 : ENVIRONMENT_VARIABLE_NAME_1,
     *      jsonKey2: ENV
     *  }
     *
     * @param prototype Prototype of expected object from the environment.
     * @returns PatchingConfigProvider
     */
    patchWithEnv(prototype) {
        let envObject = _pullEnvironmentPrototype(prototype);
        _mergeConfigs(this.#meta.config, envObject);

        return this;
    }

    get() {
        return this.#meta.config;
    }
}

/**
 *
 *   Merge properly, override only common keys.
 *
 * */
function _mergeConfigs(target, source) {

    Object.keys(source).forEach(key => {
        let obj = source[key];

        if (typeof obj === 'object') {
            if (_isDefinedNonNull(target[key])) {
                _mergeConfigs(target[key], obj);
            } else {
                target[key] = source[key];
            }
        } else {
            target[key] = source[key];
        }
    });

    return target;
}

/**
 *
 *  WARNING: Recursive, will try to improve.
 *
 *  All or nothing approach, if expected fields in prototype is not satisfied,
 *  return empty.
 *
 * */
function _pullEnvironmentPrototype(prototype) {
    let result = {};

    let prototypeKeys = Object.keys(prototype);

    for (let key of prototypeKeys) {
        let value = undefined;

        if (typeof prototype[key] === 'object') {
            value = _pullEnvironmentPrototype(prototype[key]);
        } else {
            value = process.env[prototype[key]];
        }

        if (!_isDefinedNonNull(value) || !_isNotEmpty(value)) {
            result = {};
            break;
        }

        result[key] = value;
    }

    return result;
}

function _isNotEmpty(object) {
    return Object.keys(object).length > 0;
}

function _isDefinedNonNull(object) {
    return (object !== undefined && object !== null);
}

module.exports = Config
