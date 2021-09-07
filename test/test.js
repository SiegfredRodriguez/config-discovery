const Config = require("../index");
const assert = require("assert");
const fs = require('fs');
const path = require('path');
const Yaml = require('yaml');
const Prop = require('properties');
const {UnknownFileFormatError, ParseFailureError} = require("../errors");

const LAYER_ONE_CONFIG_JSON_PATH = path.resolve(__dirname, './layer-one/config.json');
const LAYER_ONE_CONFIG_EXTENSIONLESS_PATH = path.resolve(__dirname, './layer-one/config');
const LAYER_ONE_CONFIG_PROPERTIES_PATH = path.resolve(__dirname, './layer-one/config.properties');
const LAYER_ONE_CONFIG_XML_PATH = path.resolve(__dirname, './layer-one/config.xml');
const LAYER_ONE_CONFIG_YAML_PATH = path.resolve(__dirname, './layer-one/config.yaml');
const LAYER_ONE_CONFIG_YML_PATH = path.resolve(__dirname, './layer-one/config.yml');
const LAYER_ONE_PATCH_JSON_PATH = path.resolve(__dirname, './layer-one/patch.json');
const LAYER_ONE_PATCH_YAML_PATH = path.resolve(__dirname, './layer-one/patch.yaml');
const LAYER_ONE_PATCH_YML_PATH = path.resolve(__dirname, './layer-one/patch.yml');
const LAYER_ONE_PATCH_PROPERTIES_PATH = path.resolve(__dirname, './layer-one/patch.properties');
const LAYER_ONE_B_CONFIG_JSON_PATH = path.resolve(__dirname, './layer-one-b/config.json');
// Does not exist;
const LAYER_TWO_CONFIG_JSON_PATH = path.resolve(__dirname, './layer-two/config.json');

const LAYER_ONE_CONFIG_JSON = JSON.parse(fs.readFileSync(LAYER_ONE_CONFIG_JSON_PATH));
const LAYER_ONE_CONFIG_PROPERTIES = Prop.parse(fs.readFileSync(LAYER_ONE_CONFIG_PROPERTIES_PATH).toString(), {namespaces: true});
const LAYER_ONE_CONFIG_YAML = Yaml.parse(fs.readFileSync(LAYER_ONE_CONFIG_YAML_PATH).toString());
const LAYER_ONE_CONFIG_YML = Yaml.parse(fs.readFileSync(LAYER_ONE_CONFIG_YML_PATH).toString());
const LAYER_ONE_B_CONFIG_JSON = JSON.parse(fs.readFileSync(LAYER_ONE_B_CONFIG_JSON_PATH));
const LAYER_ONE_PATCH_JSON = JSON.parse(fs.readFileSync(LAYER_ONE_PATCH_JSON_PATH));
const LAYER_ONE_PATCH_YAML = Yaml.parse(fs.readFileSync(LAYER_ONE_PATCH_YAML_PATH).toString());
const LAYER_ONE_PATCH_YML = Yaml.parse(fs.readFileSync(LAYER_ONE_PATCH_YML_PATH).toString());
const LAYER_ONE_PATCH_PROPERTIES = Prop.parse(fs.readFileSync(LAYER_ONE_PATCH_PROPERTIES_PATH).toString());

let ENV_KEY_1 = 'ENV_VAL_ONE';
let ENV_KEY_2 = 'ENV_VAL_TWO';
let ENV_KEY_3 = 'ENV_VAL_THREE';

let ENV_VALUE_1 = process.env[ENV_KEY_1];
let ENV_VALUE_2 = process.env[ENV_KEY_2];
let ENV_VALUE_3 = process.env[ENV_KEY_3];

describe(
    'Config', () => {
        describe('fromFile()', () => {
                it('should return loaded config when JSON parameter is valid.', () => {
                        let conf = new Config()
                            .fromFile(LAYER_ONE_CONFIG_JSON_PATH)
                            .get();

                        assert.deepStrictEqual(conf, LAYER_ONE_CONFIG_JSON);
                    }
                );
                it('should return empty json when parameter is not found or not valid.', () => {
                        let conf = new Config()
                            .fromFile(LAYER_TWO_CONFIG_JSON_PATH)
                            .get();

                        assert.deepStrictEqual(conf, {});
                    }
                );
                it('Should accept both YAML/YML', () => {
                        let config = new Config()
                            .fromFile(LAYER_ONE_CONFIG_YAML_PATH)
                            .get();

                        assert.deepStrictEqual(config, LAYER_ONE_CONFIG_YAML);

                        config = new Config()
                            .fromFile(LAYER_ONE_CONFIG_YML_PATH)
                            .get();

                        assert.deepStrictEqual(config, LAYER_ONE_CONFIG_YML);
                    }
                );
                it('Should use custom parser when provided', () => {

                        let config = new Config()
                            .fromFile(LAYER_ONE_CONFIG_PROPERTIES_PATH, {customParser: str => Prop.parse(str, {namespaces: true})})
                            .get();

                        assert(config, LAYER_ONE_CONFIG_PROPERTIES);

                    }
                );
                it('Should throw UnknownFileFormatError when file has no extension.', () => {

                        assert.throws(() => {
                                new Config()
                                    .fromFile(LAYER_ONE_CONFIG_EXTENSIONLESS_PATH)
                                    .get();
                            },
                            e => (e instanceof UnknownFileFormatError)
                        );

                    }
                );
                it('Should throw UnknownFileFormatError when file type is unknown, and no parser is provided.', () => {
                        assert.throws(() => {
                                new Config()
                                    .fromFile(LAYER_ONE_CONFIG_XML_PATH)
                                    .get();
                            },
                            e => (e instanceof UnknownFileFormatError)
                        );

                    }
                );
                it('Should throw ParseFailureError when parsing fails.', () => {
                        assert.throws(() => {
                                new Config()
                                    .fromFile(LAYER_ONE_CONFIG_XML_PATH, {
                                        customParser: () => {
                                            throw Error('some parsing failure.');
                                        }
                                    })
                                    .get();
                            },
                            e => (e instanceof ParseFailureError)
                        );

                    }
                );
            }
        );
        describe('fromObject()', () => {
                it('should return loaded config when parameter is valid.', () => {
                        let jsonObject = {field: 'Some value '};

                        let conf = new Config()
                            .fromObject(jsonObject)
                            .get();

                        assert.deepStrictEqual(conf, jsonObject);
                    }
                );
                it('should return empty json when parameter is not found or not valid.', () => {
                        let emptyObject = new Config()
                            .fromObject({})
                            .get();

                        let nullObject = new Config()
                            .fromObject({})
                            .get();

                        let undefinedObject = new Config()
                            .fromObject({})
                            .get();

                        assert.deepStrictEqual(emptyObject, {});
                        assert.deepStrictEqual(nullObject, {});
                        assert.deepStrictEqual(undefinedObject, {});
                    }
                );

            }
        );
        describe('fromEnv()', () => {
                it('should return loaded config when prototype is satisfied.', () => {

                        let prototype = {
                            field_one: ENV_KEY_1,
                            field_two: ENV_KEY_2,
                            field_three: {
                                field_three_a: ENV_KEY_3
                            }
                        };

                        let expected = {
                            field_one: ENV_VALUE_1,
                            field_two: ENV_VALUE_2,
                            field_three: {
                                field_three_a: ENV_VALUE_3
                            }
                        };


                        let conf = new Config()
                            .fromEnv(prototype)
                            .get();

                        assert.deepStrictEqual(conf, expected);
                    }
                );
                it('should return empty json when when prototype is not satisfied.', () => {

                        let prototype = {
                            field_one: ENV_KEY_1,
                            field_two: 'I_DONT_EXIST',
                            field_three: {
                                field_three_a: ENV_KEY_3
                            }
                        };

                        let conf = new Config()
                            .fromEnv(prototype)
                            .get();

                        assert.deepStrictEqual(conf, {});
                    }
                )

            }
        );
    }
)

describe(
    'FindFirstConfigProvider', () => {
        // Will deprecate soon, an alias for orFile() no need for advanced testing.
        describe('or()', () => {
                it('should not load if config is already found.', () => {

                        let conf = new Config()
                            .fromFile(LAYER_ONE_CONFIG_JSON_PATH)
                            .or(LAYER_ONE_B_CONFIG_JSON_PATH)
                            .get();

                        assert.deepStrictEqual(conf, LAYER_ONE_CONFIG_JSON);
                    }
                );
                it('should load if config is not yet found.', () => {
                        let conf = new Config()
                            .fromFile(LAYER_TWO_CONFIG_JSON_PATH)
                            .or(LAYER_ONE_B_CONFIG_JSON_PATH)
                            .get();

                        assert.deepStrictEqual(conf, LAYER_ONE_B_CONFIG_JSON);
                    }
                )

            }
        );
        describe('orFile()', () => {
                it('should not load if config is already found.', () => {

                        let conf = new Config()
                            .fromFile(LAYER_ONE_CONFIG_JSON_PATH)
                            .orFile(LAYER_ONE_B_CONFIG_JSON_PATH)
                            .get();

                        assert.deepStrictEqual(conf, LAYER_ONE_CONFIG_JSON);
                    }
                );
                it('should load if config is not yet found.', () => {
                        let conf = new Config()
                            .fromFile(LAYER_TWO_CONFIG_JSON_PATH)
                            .orFile(LAYER_ONE_B_CONFIG_JSON_PATH)
                            .get();

                        assert.deepStrictEqual(conf, LAYER_ONE_B_CONFIG_JSON);
                    }
                );
                it('Should accept both YAML/YML', () => {
                        let config = new Config()
                            .fromFile(LAYER_TWO_CONFIG_JSON_PATH)
                            .orFile(LAYER_ONE_CONFIG_YAML_PATH)
                            .get();

                        assert.deepStrictEqual(config, LAYER_ONE_CONFIG_YAML);

                        config = new Config()
                            .fromFile(LAYER_TWO_CONFIG_JSON_PATH)
                            .orFile(LAYER_ONE_CONFIG_YML_PATH)
                            .get();

                        assert.deepStrictEqual(config, LAYER_ONE_CONFIG_YML);
                    }
                );
                it('Should use custom parser when provided', () => {

                        let config = new Config()
                            .fromFile(LAYER_TWO_CONFIG_JSON_PATH)
                            .orFile(LAYER_ONE_CONFIG_PROPERTIES_PATH, {customParser: str => Prop.parse(str, {namespaces: true})})
                            .get();

                        assert(config, LAYER_ONE_CONFIG_PROPERTIES);

                    }
                );
                it('Should throw UnknownFileFormatError when file has no extension.', () => {

                        assert.throws(() => {
                                new Config()
                                    .fromFile(LAYER_TWO_CONFIG_JSON_PATH)
                                    .orFile(LAYER_ONE_CONFIG_EXTENSIONLESS_PATH)
                                    .get();
                            },
                            e => (e instanceof UnknownFileFormatError)
                        );

                    }
                );
                it('Should throw UnknownFileFormatError when file type is unknown, and no parser is provided.', () => {
                        assert.throws(() => {
                                new Config()
                                    .fromFile(LAYER_TWO_CONFIG_JSON_PATH)
                                    .orFile(LAYER_ONE_CONFIG_XML_PATH)
                                    .get();
                            },
                            e => (e instanceof UnknownFileFormatError)
                        );

                    }
                );
                it('Should throw ParseFailureError when parsing fails.', () => {
                        assert.throws(() => {
                                new Config()
                                    .fromFile(LAYER_TWO_CONFIG_JSON_PATH)
                                    .orFile(LAYER_ONE_CONFIG_XML_PATH, {
                                        customParser: () => {
                                            throw Error('some parsing failure.');
                                        }
                                    })
                                    .get();
                            },
                            e => (e instanceof ParseFailureError)
                        );

                    }
                );
            }
        );
        describe('orObject()', () => {
                it('should not load if config is already found.', () => {

                        let object = {data: 'Some data'};

                        let conf = new Config()
                            .fromFile(LAYER_ONE_CONFIG_JSON_PATH)
                            .orObject(object)
                            .get();

                        assert.deepStrictEqual(conf, LAYER_ONE_CONFIG_JSON);
                    }
                );
                it('should load if config is not yet found.', () => {
                        let object = {data: 'Some data'};

                        let conf = new Config()
                            .fromFile(LAYER_TWO_CONFIG_JSON_PATH)
                            .orObject(object)
                            .get();

                        assert.deepStrictEqual(conf, object);
                    }
                )

            }
        );
        describe('orEnv()', () => {
                it('should not load if config is already found.', () => {

                        let prototype = {
                            field_one: ENV_KEY_1,
                            field_two: ENV_KEY_2,
                            field_three: {
                                field_three_a: ENV_KEY_3
                            }
                        };

                        let conf = new Config()
                            .fromFile(LAYER_ONE_CONFIG_JSON_PATH)
                            .orEnv(prototype)
                            .get();

                        assert.deepStrictEqual(conf, LAYER_ONE_CONFIG_JSON);
                    }
                );
                it('should load if config is not yet found.', () => {

                        let prototype = {
                            field_one: ENV_KEY_1,
                            field_two: ENV_KEY_2,
                            field_three: {
                                field_three_a: ENV_KEY_3
                            }
                        };

                        let expected = {
                            field_one: ENV_VALUE_1,
                            field_two: ENV_VALUE_2,
                            field_three: {
                                field_three_a: ENV_VALUE_3
                            }
                        };

                        let conf = new Config()
                            .fromFile(LAYER_TWO_CONFIG_JSON_PATH)
                            .orEnv(prototype)
                            .get();

                        assert.deepStrictEqual(conf, expected);
                    }
                )

            }
        );
    }
)

describe('PatchingConfigProvider', () => {
        describe('configFile()', () => {
                it('should patch previous result with new values from patch', () => {
                        let conf = new Config()
                            .fromFile(LAYER_ONE_CONFIG_JSON_PATH)
                            .thenPatchWith()
                            .configFile(LAYER_ONE_PATCH_JSON_PATH)
                            .get();

                        assert.deepStrictEqual(conf['simple_keyone'], LAYER_ONE_PATCH_JSON['simple_keyone']);
                        assert.deepStrictEqual(conf['simple_keytwo'], LAYER_ONE_PATCH_JSON['simple_keytwo']);

                        // Sanity check for nested JSON
                        assert.notDeepStrictEqual(conf['nested_valuethree'], LAYER_ONE_PATCH_JSON['nested_valuethree']);
                    }
                );
                it('should ignore non existing patch', () => {
                        let conf = new Config()
                            .fromFile(LAYER_ONE_CONFIG_JSON_PATH)
                            .thenPatchWith()
                            .configFile(LAYER_TWO_CONFIG_JSON_PATH)
                            .get();

                        assert.deepStrictEqual(conf, LAYER_ONE_CONFIG_JSON);
                    }
                );
                it('Should accept both YAML/YML', () => {
                        let conf = new Config()
                            .fromFile(LAYER_ONE_CONFIG_JSON_PATH)
                            .thenPatchWith()
                            .configFile(LAYER_ONE_PATCH_YAML_PATH)
                            .get();

                        assert.deepStrictEqual(conf['simple_keyone'], LAYER_ONE_PATCH_YAML['simple_keyone']);
                        assert.deepStrictEqual(conf['simple_keytwo'], LAYER_ONE_PATCH_YAML['simple_keytwo']);
                        assert.notDeepStrictEqual(conf['nested_valuethree'], LAYER_ONE_PATCH_YAML['nested_valuethree']);

                        conf = new Config()
                            .fromFile(LAYER_ONE_CONFIG_JSON_PATH)
                            .thenPatchWith()
                            .configFile(LAYER_ONE_PATCH_YML_PATH)
                            .get();

                        assert.deepStrictEqual(conf['simple_keyone'], LAYER_ONE_PATCH_YML['simple_keyone']);
                        assert.deepStrictEqual(conf['simple_keytwo'], LAYER_ONE_PATCH_YML['simple_keytwo']);
                        assert.notDeepStrictEqual(conf['nested_valuethree'], LAYER_ONE_PATCH_YML['nested_valuethree']);

                    }
                );
                it('Should use custom parser when provided', () => {

                        let conf = new Config()
                            .fromFile(LAYER_ONE_CONFIG_JSON_PATH)
                            .thenPatchWith()
                            .configFile(LAYER_ONE_PATCH_PROPERTIES_PATH, {customParser: str => Prop.parse(str, {namespaces: true})})
                            .get();

                        assert.deepStrictEqual(conf['simple_keyone'], LAYER_ONE_PATCH_PROPERTIES['simple_keyone']);
                        assert.deepStrictEqual(conf['simple_keytwo'], LAYER_ONE_PATCH_PROPERTIES['simple_keytwo']);
                        assert.notDeepStrictEqual(conf['nested_valuethree'], LAYER_ONE_PATCH_PROPERTIES['nested_valuethree']);

                    }
                );
                it('Should throw UnknownFileFormatError when file has no extension.', () => {

                        assert.throws(() => {
                                new Config()
                                    .fromFile(LAYER_ONE_CONFIG_JSON_PATH)
                                    .thenPatchWith()
                                    .configFile(LAYER_ONE_CONFIG_EXTENSIONLESS_PATH)
                                    .get();
                            },
                            e => (e instanceof UnknownFileFormatError)
                        );

                    }
                );
                it('Should throw UnknownFileFormatError when file type is unknown, and no parser is provided.', () => {
                        assert.throws(() => {
                                new Config()
                                    .fromFile(LAYER_ONE_CONFIG_JSON_PATH)
                                    .thenPatchWith()
                                    .configFile(LAYER_ONE_CONFIG_XML_PATH)
                                    .get();
                            },
                            e => (e instanceof UnknownFileFormatError)
                        );

                    }
                );
                it('Should throw ParseFailureError when parsing fails.', () => {
                        assert.throws(() => {
                                new Config()
                                    .fromFile(LAYER_ONE_CONFIG_JSON_PATH)
                                    .thenPatchWith()
                                    .configFile(LAYER_ONE_CONFIG_XML_PATH, {
                                        customParser: () => {
                                            throw Error('some parsing failure.');
                                        }
                                    })
                                    .get();
                            },
                            e => (e instanceof ParseFailureError)
                        );

                    }
                );
            }
        );
        describe('patchWithEnv()', () => {
                it('should not patch if prototype is null, undefined, or empty', () => {
                        let baseConfig = {
                            data_one: 'Some value one',
                            data_two: 2,
                            nested: {nested_one: 'Nested value one', nested_two: 'n2'}
                        }

                        let config = new Config()
                            .fromObject(baseConfig)
                            .thenPatchWith()
                            .patchWithEnv(null)
                            .get();

                        assert.deepStrictEqual(config, baseConfig);

                        config = new Config()
                            .fromObject(baseConfig)
                            .thenPatchWith()
                            .patchWithEnv(undefined)
                            .get();

                        assert.deepStrictEqual(config, baseConfig);

                        config = new Config()
                            .fromObject(baseConfig)
                            .thenPatchWith()
                            .patchWithEnv({})
                            .get();

                        assert.deepStrictEqual(config, baseConfig);

                    }
                );
                it('should not patch if prototype is unsatisfied.', () => {
                        let baseConfig = {
                            data_one: 'Some value one',
                            data_two: 2,
                            nested: {nested_one: 'Nested value one', nested_two: 'n2'}
                        }

                        let prototype = {
                            data_one: ENV_KEY_1,
                            data_three: 'I_DONT_EXIST'
                        };

                        let config = new Config()
                            .fromObject(baseConfig)
                            .thenPatchWith()
                            .patchWithEnv(prototype)
                            .get();

                        assert.deepStrictEqual(config, baseConfig);
                    }
                );
                it('should patch both existing and new keys', () => {
                        let baseConfig = {
                            data_one: 'Some value one',
                            data_two: 2,
                            nested: {nested_one: 'Nested value one', nested_two: 'n2'}
                        }

                        let prototype = {
                            data_one: ENV_KEY_1,
                            data_three: ENV_KEY_2
                        };

                        let config = new Config()
                            .fromObject(baseConfig)
                            .thenPatchWith()
                            .patchWithEnv(prototype)
                            .get();

                        assert.deepStrictEqual(config.data_one, ENV_VALUE_1);
                        assert.deepStrictEqual(config.data_two, baseConfig.data_two);
                        assert.deepStrictEqual(config.data_three, ENV_VALUE_2);
                    }
                );
                it('should patch only specific key in nested  objects', () => {
                        let baseConfig = {
                            data_one: 'Some value one',
                            data_two: 2,
                            nested: {nested_one: 'Nested value one', nested_two: 'n2'}
                        }

                        let prototype = {
                            nested: {
                                nested_two: ENV_KEY_2
                            }
                        };

                        let config = new Config()
                            .fromObject(baseConfig)
                            .thenPatchWith()
                            .patchWithEnv(prototype)
                            .get();

                        assert.deepStrictEqual(config.nested.nested_one, baseConfig.nested.nested_one);
                        assert.deepStrictEqual(config.nested.nested_two, ENV_VALUE_2);
                    }
                );
            }
        );
        describe('env()', () => {
                it('should not patch if prototype is null, undefined, or empty', () => {
                        let baseConfig = {
                            data_one: 'Some value one',
                            data_two: 2,
                            nested: {nested_one: 'Nested value one', nested_two: 'n2'}
                        }

                        let config = new Config()
                            .fromObject(baseConfig)
                            .thenPatchWith()
                            .env(null)
                            .get();

                        assert.deepStrictEqual(config, baseConfig);

                        config = new Config()
                            .fromObject(baseConfig)
                            .thenPatchWith()
                            .env(undefined)
                            .get();

                        assert.deepStrictEqual(config, baseConfig);

                        config = new Config()
                            .fromObject(baseConfig)
                            .thenPatchWith()
                            .env({})
                            .get();

                        assert.deepStrictEqual(config, baseConfig);

                    }
                );
                it('should not patch if prototype is unsatisfied.', () => {
                        let baseConfig = {
                            data_one: 'Some value one',
                            data_two: 2,
                            nested: {nested_one: 'Nested value one', nested_two: 'n2'}
                        }

                        let prototype = {
                            data_one: ENV_KEY_1,
                            data_three: 'I_DONT_EXIST'
                        };

                        let config = new Config()
                            .fromObject(baseConfig)
                            .thenPatchWith()
                            .env(prototype)
                            .get();

                        assert.deepStrictEqual(config, baseConfig);
                    }
                );
                it('should patch both existing and new keys', () => {
                        let baseConfig = {
                            data_one: 'Some value one',
                            data_two: 2,
                            nested: {nested_one: 'Nested value one', nested_two: 'n2'}
                        }

                        let prototype = {
                            data_one: ENV_KEY_1,
                            data_three: ENV_KEY_2
                        };

                        let config = new Config()
                            .fromObject(baseConfig)
                            .thenPatchWith()
                            .env(prototype)
                            .get();

                        assert.deepStrictEqual(config.data_one, ENV_VALUE_1);
                        assert.deepStrictEqual(config.data_two, baseConfig.data_two);
                        assert.deepStrictEqual(config.data_three, ENV_VALUE_2);
                    }
                );
                it('should patch only specific key in nested  objects', () => {
                        let baseConfig = {
                            data_one: 'Some value one',
                            data_two: 2,
                            nested: {nested_one: 'Nested value one', nested_two: 'n2'}
                        }

                        let prototype = {
                            nested: {
                                nested_two: ENV_KEY_2
                            }
                        };

                        let config = new Config()
                            .fromObject(baseConfig)
                            .thenPatchWith()
                            .env(prototype)
                            .get();

                        assert.deepStrictEqual(config.nested.nested_one, baseConfig.nested.nested_one);
                        assert.deepStrictEqual(config.nested.nested_two, ENV_VALUE_2);
                    }
                );
            }
        );
        describe('object()', () => {
                it('should not patch if object is null, undefined, or empty', () => {
                        let baseConfig = {
                            data_one: 'Some value one',
                            data_two: 2,
                            nested: {nested_one: 'Nested value one', nested_two: 'n2'}
                        }

                        let config = new Config()
                            .fromObject(baseConfig)
                            .thenPatchWith()
                            .object(null)
                            .get();

                        assert.deepStrictEqual(config, baseConfig);

                        config = new Config()
                            .fromObject(baseConfig)
                            .thenPatchWith()
                            .object(undefined)
                            .get();

                        assert.deepStrictEqual(config, baseConfig);

                        config = new Config()
                            .fromObject(baseConfig)
                            .thenPatchWith()
                            .object({})
                            .get();

                        assert.deepStrictEqual(config, baseConfig);

                    }
                );
                it('should patch both existing and new keys', () => {
                        let baseConfig = {
                            data_one: 'Some value one',
                            data_two: 2,
                            nested: {nested_one: 'Nested value one', nested_two: 'n2'}
                        }

                        let patch = {
                            data_two: 75,
                            data_three: 'non-existing data'
                        };

                        let config = new Config()
                            .fromObject(baseConfig)
                            .thenPatchWith()
                            .object(patch)
                            .get();

                        assert.deepStrictEqual(config.data_one, baseConfig.data_one);
                        assert.deepStrictEqual(config.data_two, patch.data_two);
                        assert.deepStrictEqual(config.data_three, patch.data_three);
                    }
                );
                it('should patch only specific key in nested  objects', () => {
                        let baseConfig = {
                            data_one: 'Some value one',
                            data_two: 2,
                            nested: {nested_one: 'Nested value one', nested_two: 'n2'}
                        }

                        let patch = {
                            nested: {
                                nested_one: 'Patch value'
                            }
                        };

                        let config = new Config()
                            .fromObject(baseConfig)
                            .thenPatchWith()
                            .object(patch)
                            .get();

                        assert.deepStrictEqual(config.data_one, baseConfig.data_one);
                        assert.deepStrictEqual(config.nested.nested_two, baseConfig.nested.nested_two);
                        assert.deepStrictEqual(config.nested.nested_one, patch.nested.nested_one);
                    }
                );
            }
        );
    }
)
