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
        const {config, parser} = this.#meta;

        if (fs.existsSync(absolutePath)) {
            let byteData = fs.readFileSync(absolutePath);
            let object = parser(byteData);

            _mergeConfigs(config, object);

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
     * Will try to load configuration if the previous
     * attempt from fromFile() or another or() failed.
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


function _mergeConfigs(target, source) {

    Object.keys(source).forEach(key => {
        target[key] = source[key];
    });

    return target;
}

/**
 *
 *  All or nothing approach, if expected fields in prototype is not satisfied,
 *  return empty.
 *
 * */
function _pullEnvironmentPrototype(prototype) {
    let result = {};

    let prototypeKeys = Object.keys(prototype);

    for (let key of prototypeKeys) {
        let value = process.env[prototype[key]];

        if (value === undefined) {
            result = {};
            break;
        }

        result[key] = value;
    }

    return result;
}

module.exports.Config = Config
