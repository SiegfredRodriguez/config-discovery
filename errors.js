function ParseFailureError(message = 'Parse configuration file failed.') {
    this.message = `ParseFailureError : ${message}`;
    return this;
}

function UnknownFileFormatError(message = 'cannot natively parse file format, please pass a custom parser function(string) => JSON') {
    this.message = `UnknownFileFormatError : ${message}`;
    return this;
}

function NoConfigFoundError(message = 'no config found in the chain') {
    this.message = `NoConfigFoundError ${message}`;
    return this;
}

module.exports = { ParseFailureError, UnknownFileFormatError, NoConfigFoundError };