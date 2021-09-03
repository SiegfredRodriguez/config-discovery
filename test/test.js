const Config = require("../index");
const assert = require("assert");
const fs = require('fs');
const path = require('path');

const LAYER_ONE_CONFIG_JSON_PATH = path.resolve(__dirname, './layer-one/config.json');
const LAYER_ONE_PATCH_JSON_PATH = path.resolve(__dirname, './layer-one/patch.json');
const LAYER_ONE_B_CONFIG_JSON_PATH = path.resolve(__dirname, './layer-one-b/config.json');
// Does not exist;
const LAYER_TWO_CONFIG_JSON_PATH = path.resolve(__dirname, './layer-two/config.json');


const LAYER_ONE_CONFIG_JSON = JSON.parse(fs.readFileSync(LAYER_ONE_CONFIG_JSON_PATH));
const LAYER_ONE_B_CONFIG_JSON = JSON.parse(fs.readFileSync(LAYER_ONE_B_CONFIG_JSON_PATH));
const LAYER_ONE_PATCH_JSON = JSON.parse(fs.readFileSync(LAYER_ONE_PATCH_JSON_PATH));

let ENV_KEY_1 = 'ENV_VAL_ONE';
let ENV_KEY_2 = 'ENV_VAL_TWO';
let ENV_KEY_3 = 'ENV_VAL_THREE';

let ENV_VALUE_1 = process.env[ENV_KEY_1];
let ENV_VALUE_2 = process.env[ENV_KEY_2];
let ENV_VALUE_3 = process.env[ENV_KEY_3];


describe(
    'Config', () => {
        describe('fromFile()', () => {
                it('should return loaded config when parameter is valid.', () => {
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
                )

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
                )

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
        // Will deprecate soon
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
                )

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
                )
            }
        );

        describe('patchWithEnv()', () => {
                it('should patch previous result with new values from patch', () => {

                        let prototype = {
                            simple_keyone: ENV_KEY_1,
                            simple_keytwo: ENV_KEY_2,
                            nested_valuethree: {
                                simple_valuethree_a: ENV_KEY_3
                            }
                        };

                        let conf = new Config()
                            .fromFile(LAYER_ONE_CONFIG_JSON_PATH)
                            .thenPatchWith()
                            .patchWithEnv(prototype)
                            .get();

                        assert.deepStrictEqual(conf['simple_keyone'], ENV_VALUE_1);
                        assert.deepStrictEqual(conf['simple_keytwo'], ENV_VALUE_2);

                        // Sanity check for nested JSON
                        assert.deepStrictEqual(conf['nested_valuethree']['simple_valuethree_a'], ENV_VALUE_3);
                    }
                );
                it('should ignore when prototype cannot be satisfied', () => {
                        let conf = new Config()
                            .fromFile(LAYER_ONE_CONFIG_JSON_PATH)
                            .thenPatchWith()
                            .patchWithEnv({simple_keyone: 'IDONT_EXIST_DUDE'})
                            .get();

                        assert.deepStrictEqual(conf, LAYER_ONE_CONFIG_JSON);
                    }
                )
            }
        );
    }
)
