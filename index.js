let fs = require('fs');
const path = require("path");
const {UnknownFileFormatError, ParseFailureError, NoConfigFoundError} = require("./errors");

/**
 * @class
 * @classdesc Main class of config-discovery, every usage starts with instantiating this class.
 */
class Config {
    #meta;

    #constructor_defaults = {parser: JSON.parse, logger: console.log}

    /**
     * @param [options.parser=JSON.parse] IGNORED, this is legacy, will remove in the future.
     * @param [options.logger=console.log] Logger function, function(string)
     */
    constructor(options = {parser: JSON.parse, logger: console.log}) {
        let _options = _mergeConfigs(this.#constructor_defaults, options);
        this.#meta = {config: {}, logger: _options.logger};
    }


    /**
     * Will try to load initial config from provided
     * absolutePath. If config file is not found, it does nothing.
     *
     * @example
     *
     *  // With out-of-the-box support for JSON/YAML
     *  let config = new Config()
     *      .fromFile('/config/config.json')
     *      .get();
     *
     *  // Or with a custom file
     *  let xmlParser = (...) => .... ;
     *  let config = new Config()
     *      .fromFile('/config/config.xml', xmlParser)
     *      .get();
     *
     *
     * @param {string} absolutePath - Possible location of a configuration file
     * @param {Parser} [options.customParser=null] - Custom parser for the config file, must accept fs.readFileSync().toString() and return JSON Object.
     * @throws {UnknownFileFormatError} - When passing a non YAML/JSON config without customParser, or when file extension is not known.
     * @throws {ParseFailureError} - When native JSON/YAML or customParser fails to parse provided config.
     * @returns {FindFirstConfigProvider}
     */
    fromFile(absolutePath, options = {customParser: null}) {
        const {logger} = this.#meta;

        let object = _loadFile(absolutePath, options);
        let chainObject = this.fromObject(object);

        if (this.#meta.foundFirst) {
            _tryLog(`Configuration ${absolutePath} found first, will use as configuration`, logger);
        }

        return chainObject;
    }

    /**
     * Will try to load initial config from the environment based
     * on provided prototype. If prototype is not satisfied it does
     * nothing.
     *
     * @example
     *
     * // Given example environment variables exist
     * // ENV_VARIABLE_URL="dev-db:5432/dev"
     * // ENV_VARIABLE_USERNAME="dev"
     * // ENV_VARIABLE_PASSWORD="p@sSword123"
     *
     * let prototype = {
     *     url: 'ENV_VARIABLE_URL',
     *     nested: {
     *         username: 'ENV_VARIABLE_USERNAME',
     *         password: 'ENV_VARIABLE_PASSWORD'
     *     }
     * };
     *
     *
     * let config = new Config()
     *     .fromEnv(prototype)
     *     .get();
     *
     *
     * // Will result in
     * // let config = {
     * //     url: 'dev-db:5432/dev',
     * //     nested: {
     * //         username: 'dev',
     * //         password: 'p@sSword123'
     * //     }
     * // };
     *
     * @param {JSON} prototype Prototype for an object to generate from the ENV
     * @returns {FindFirstConfigProvider}
     */
    fromEnv(prototype) {
        const {logger} = this.#meta;
        let object = {};

        if (_isDefinedNonNull(prototype) && _isNotEmpty(prototype)) {
            object = _pullEnvironmentPrototype(prototype);
        }

        let chainObject = this.fromObject(object);

        if (this.#meta.foundFirst) {
            _tryLog(`Environment configuration with prototype ${JSON.stringify(prototype)} found first, will use as configuration`, logger);
        }

        return chainObject;
    }

    /**
     * Will try to load initial config from provided object,
     * if jsonObject is empty or not valid, will ignore.
     *
     * Intended for quick debugging or setup for a follow up patching.
     *
     * Though I understand that it may not be necessary in this context.
     * @example
     *
     * let debugConfig = {
     *     username: 'user',
     *     password: 'password'
     * };
     *
     *
     * let config = new Config()
     *     .fromObject(debugConfig)
     *     .get();
     *
     *
     * @param {JSON} jsonObject A possibly non empty object
     * @returns {FindFirstConfigProvider}
     */
    fromObject(jsonObject) {
        const {config, logger} = this.#meta;

        if (_isDefinedNonNull(jsonObject) && _isNotEmpty(jsonObject)) {
            _mergeConfigs(config, jsonObject);
            this.#meta.foundFirst = true;
            _tryLog(`Config object loaded.`, logger);
        }

        return new FindFirstConfigProvider(this.#meta);
    }
}

/**
 * @class
 * UTILITY CLASS DO NOT INSTANTIATE.
 */
class FindFirstConfigProvider {
    #meta

    /**
     * @private
     */
    constructor(meta) {
        this.#meta = meta;
    }

    /**
     * @deprecated
     * Replaced with orFile(absolutePath) for interface consistency.
     *
     * @param {string} absolutePath - Possible location of a configuration file
     * @param {Parser} [options.customParser=null] - Custom parser for the config file, must accept fs.readFileSync().toString() and return JSON Object.
     * @throws {UnknownFileFormatError} - When passing a non YAML/JSON config without customParser, or when file extension is not known.
     * @throws {ParseFailureError} - When native JSON/YAML or customParser fails to parse provided config.
     * @returns {FindFirstConfigProvider}
     */
    or(absolutePath, options = {customParser: null}) {
        return this.orFile(absolutePath, options);
    }

    /**
     * Will try to load configuration from absolutePath if the previous
     * attempts from from*() or another or*() failed.
     *
     * @example
     *
     *  // With out-of-the-box support for JSON/YAML
     *  let config = new Config()
     *      .fromFile('/config/config.json')
     *      .orFile('/var/config.yaml')
     *      .orFile('config.yml')
     *      .get();
     *
     *  // Or with a custom file
     *  let xmlParser = (string) => JSON ;
     *  let propParser = (string) => JSON ;
     *
     *  let config = new Config()
     *      .fromFile('/config/config.yaml')
     *      .orFile('/var/config.xml',  xmlParser)
     *      .orFile('/etc/configs/config.properties' propParser)
     *      .get();
     *
     *
     * @param {string} absolutePath - Possible location of a configuration file
     * @param {Parser} [options.customParser=null] - Custom parser for the config file, must accept fs.readFileSync().toString() and return JSON Object.
     * @throws {UnknownFileFormatError} - When passing a non YAML/JSON config without customParser, or when file extension is not known.
     * @throws {ParseFailureError} - When native JSON/YAML or customParser fails to parse provided config.
     * @returns {FindFirstConfigProvider}
     */
    orFile(absolutePath, options = {customParser: null}) {
        const {foundFirst, logger} = this.#meta;
        let object = {};

        if (!foundFirst) {
            object = _loadFile(absolutePath, options);
        }

        let self = this.orObject(object);

        if (this.#meta.foundFirst) {
            _tryLog(`Configuration ${absolutePath} found first, will use as configuration`, logger);
        }

        return self;
    }

    /**
     * Will try to load configuration from environment
     * based on provided prototype if the previous
     * attempts from from*() or another or*() failed.
     * @param prototype Prototype for an object to generate from the ENV
     * @returns {FindFirstConfigProvider}
     */
    orEnv(prototype) {
        const {foundFirst, logger} = this.#meta;

        if (!foundFirst) {
            if (_isDefinedNonNull(prototype) && _isNotEmpty(prototype)) {
                let object = _pullEnvironmentPrototype(prototype);
                this.orObject(object);

                if (this.#meta.foundFirst) {
                    _tryLog(`Environment configuration with prototype ${JSON.stringify(prototype)} found first, will use as configuration`, logger);
                }
            }
        }

        return this;
    }

    /**
     * Will try to load configuration from provided object if the previous
     * attempt from from*() or another or*() failed.
     * @param jsonObject A possibly non empty jsonObject
     * @returns {FindFirstConfigProvider}
     */
    orObject(jsonObject) {
        const {config, foundFirst, logger} = this.#meta;

        if (!foundFirst) {
            if (_isDefinedNonNull(jsonObject) && _isNotEmpty(jsonObject)) {
                _mergeConfigs(config, jsonObject);
                this.#meta.foundFirst = true;
                _tryLog(`Config object loaded.`, logger);
            }
        }

        return this;
    }

    /**
     * Marks the transition from finding first config to
     * patching current config from another config file
     * or config assembled from the environment.
     * @throws NoConfigFoundError When none of the patch alternatives are found, you can't patch a non existing configuration.
     * @returns {PatchingConfigProvider}
     */
    thenPatchWith() {

        if (!this.#meta.foundFirst) {
            throw new NoConfigFoundError(`No config found, cannot continue with patching.`);
        }

        let metadata = this.#meta;
        this.#meta = undefined;
        return new PatchingConfigProvider(metadata);
    }

    /**
     * Will return the configuration.
     * @returns {JSON} The configuration object.
     */
    get() {

        if (!this.#meta.foundFirst) {
            throw new NoConfigFoundError(`No configuration found.`);
        }

        return this.#meta.config;
    }
}

/**
 * @class
 *  UTILITY CLASS DO NOT INSTANTIATE.
 */
class PatchingConfigProvider {
    #meta

    /**
     * @private
     */
    constructor(meta) {
        this.#meta = meta;
    }

    /**
     * Will try to load specified config file,
     * and patch current configuration.
     *
     * @example
     *
     *  // Given Example
     *  //
     *  //  patch.yaml --
     *  //  credentials:
     *  //    username: user
     *  //    password: mypassword
     *  //
     *  //  config.json --
     *  //  {
     *  //     "url": "database:5432/devdb"
     *  //  }
     *  //
     *  //  patch.properties --
     *  //  credentials.username = user
     *  //  credentials.password = mypassword
     *  //
     *
     *  // With out-of-the-box support for JSON/YAML
     *  let config = new Config()
     *      .fromFile('/config/config.json')
     *      .patchWith()
     *      .configFile('/etc/credentials/patch.yaml')
     *      .get();
     *
     *  // Or with a custom file
     *  let propParser = (string) => JSON ;
     *
     *  let config = new Config()
     *      .fromFile('/config/config.yaml')
     *      .patchWith()
     *      .orFile('/etc/configs/patch.properties' propParser)
     *      .get();
     *
     *
     * @param {string} absolutePath - Possible location of a configuration file
     * @param {Parser} [options.customParser=null] - Custom parser for the config file, must accept fs.readFileSync().toString() and return JSON Object.
     * @throws {UnknownFileFormatError} - When passing a non YAML/JSON config without customParser, or when file extension is not known.
     * @throws {ParseFailureError} - When native JSON/YAML or customParser fails to parse provided config.
     * @returns {PatchingConfigProvider}
     */
    configFile(absolutePath, options = {customParser: null}) {
        let {logger} = this.#meta;

        let object = _loadFile(absolutePath, options);
        let self = this.object(object);

        if (_isNotEmpty(object)) {
            _tryLog(`Patched with file ${absolutePath}`, logger);
        }

        return self;
    }

    /**
     * @deprecated
     * Replaced with env(prototype) for interface consistency.
     *
     * @param prototype Prototype of expected object from the environment.
     * @returns {PatchingConfigProvider}
     */
    patchWithEnv(prototype) {
        return this.env(prototype);
    }

    /**
     *
     *  Will try to patch current config with JSON object generated
     *  from environment prototype.
     *
     * @param prototype
     * @returns {PatchingConfigProvider}
     */
    env(prototype) {
        let {logger} = this.#meta;
        if (_isDefinedNonNull(prototype) && _isNotEmpty(prototype)) {
            let envObject = _pullEnvironmentPrototype(prototype);
            this.object(envObject);

            if (_isNotEmpty(envObject)) {
                _tryLog(`Patched with env prototype ${JSON.stringify(prototype)}`, logger);
            }
        }

        return this;
    }

    /**
     *
     *  Will try to patch current config with JSON object if
     *  its is defined and not empty.
     *
     * @param jsonObject
     * @returns {PatchingConfigProvider}
     */
    object(jsonObject) {

        if (_isDefinedNonNull(jsonObject) && _isNotEmpty(jsonObject)) {
            let {config} = this.#meta;
            _mergeConfigs(config, jsonObject);
            _tryLog(`Applied config object patch`);
        }

        return this;
    }

    /**
     * Will return the configuration.
     * @returns {JSON} The configuration object.
     */
    get() {
        _tryLog(`WARNING: No patches were found and non were applied.`);
        return this.#meta.config;
    }
}

/**
 *  @ignore
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
 *  @ignore
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

/**
 * @ignore
 */
function _isNotEmpty(object) {
    return Object.keys(object).length > 0;
}

/**
 * @ignore
 */
function _isDefinedNonNull(object) {
    return (object !== undefined && object !== null);
}

/**
 * @ignore
 */
function _getParser(filePath) {
    let extension = path.extname(filePath);

    if (extension.length === 0) {
        throw new UnknownFileFormatError(`Can't find file extensions of ${filePath}, try passing custom parser`);
    }

    extension = extension.slice(1, extension.length);
    let parser = KNOWN_FILE_PARSER[extension];

    if (!_isDefinedNonNull(parser)) {
        throw new UnknownFileFormatError(`Config-discovery auto parse only supports JSON and YAML/YML files, you can pass your own parser via options:{ customParser: (stringValue) => JSONObject }.`)
    }

    return parser;
}

/**
 *  @ignore
 * */
function _loadFile(absolutePath, options = {customParser: null}) {

    let object = {};

    if (fs.existsSync(absolutePath)) {
        let byteData = fs.readFileSync(absolutePath);
        let parser = _isDefinedNonNull(options.customParser) ? options.customParser : _getParser(absolutePath);

        try {
            object = parser(byteData.toString());
        } catch (e) {
            throw new ParseFailureError(e.toString());
        }
    }

    return object;
}

/**
 * @ignore
 */
function _tryLog(message, logger) {
    let env = process.env['NODE_ENV'];
    if (_isDefinedNonNull(logger) && (env !== 'production' && env !== 'test')) {
        logger(message);
    }
}

/**
 * @ignore
 */
const yamlParser = (dataString) => {
    return require('yaml').parse(dataString);
}

/**
 * @ignore
 */
const jsonParser = (dataString) => {
    return JSON.parse(dataString);
}

/**
 * @ignore
 */
const KNOWN_FILE_PARSER = {
    yaml: yamlParser,
    yml: yamlParser,
    json: jsonParser
};

module.exports = Config


/**
 *  Custom parser callback
 *
 *  @callback Parser
 *  @param {string} rawString - String loaded from fs.readSync().toString().
 *  @return {JSON} - Parsed JSON object.
 */

/**
 *  Custom parser callback
 *
 *  @callback Logger
 *  @param {string} rawString - String loaded from fs.readSync().toString().
 *  @return {void|any} - Parsed JSON object.
 */
