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
        )
    }
)

describe(
    'FindFirstConfigProvider', () => {
        describe('or()', () => {
                it('should return first found configuration', () => {
                        let conf = new Config()
                            .fromFile(LAYER_ONE_CONFIG_JSON_PATH)
                            .or(LAYER_ONE_B_CONFIG_JSON_PATH)
                            .get();

                        assert.deepStrictEqual(conf, LAYER_ONE_CONFIG_JSON);
                    }
                );
                it('should return next config when found, then stop.', () => {
                        let conf = new Config()
                            .fromFile(LAYER_TWO_CONFIG_JSON_PATH)
                            .or(LAYER_ONE_B_CONFIG_JSON_PATH)
                            .or(LAYER_ONE_CONFIG_JSON_PATH)
                            .get();

                        assert.deepStrictEqual(conf, LAYER_ONE_B_CONFIG_JSON);
                    }
                )

            }
        )
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
        )
    }
)
