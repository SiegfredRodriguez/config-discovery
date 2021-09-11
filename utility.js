let fs = require('fs');
const path = require("path");
const {UnknownFileFormatError, ParseFailureError } = require("./errors");

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

exports._mergeConfigs = _mergeConfigs;
exports._pullEnvironmentPrototype = _pullEnvironmentPrototype;
exports._getParser = _getParser;
exports._loadFile = _loadFile;
exports._isNotEmpty = _isNotEmpty;
exports._isDefinedNonNull = _isDefinedNonNull;
exports._tryLog = _tryLog;

