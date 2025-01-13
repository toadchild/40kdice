function qunit_test() {
    QUnit.hooks.beforeEach(function() {
        TEST_OVERRIDE = true;
    });

    QUnit.module('parse_dice_prob_array');

    QUnit.test('integer', function(assert) {
        var hit_dice = '3';

        var attacks = parse_dice_prob_array(hit_dice, 1);

        var expected = {
            "mortal": [
                [
                    0.0
                ],
                [
                    0.0
                ],
                [
                    0.0
                ],
                [
                    1.0
                ]
            ],
            "normal": [
                0.0,
                0.0,
                0.0,
                1.0
            ]
        };
        assert.deepEqual(attacks, expected, "attacks");
    });

    QUnit.test('one die', function(assert) {
        var hit_dice = 'd4';

        var attacks = parse_dice_prob_array(hit_dice, 1);

        var expected = {
            "mortal": [
                [
                    0.0
                ],
                [
                    0.25
                ],
                [
                    0.25
                ],
                [
                    0.25
                ],
                [
                    0.25
                ]
            ],
            "normal": [
                0.0,
                0.25,
                0.25,
                0.25,
                0.25
            ]
        };
        assert.deepEqual(attacks, expected, "attacks");
    });

    QUnit.test('two dice', function(assert) {
        var hit_dice = '2d6';

        var attacks = parse_dice_prob_array(hit_dice, 1);

        var expected = {
            "mortal": [
                [
                    0
                ],
                [
                    0
                ],
                [
                    0.027777777777777776
                ],
                [
                    0.05555555555555555
                ],
                [
                    0.08333333333333333
                ],
                [
                    0.1111111111111111
                ],
                [
                    0.1388888888888889
                ],
                [
                    0.16666666666666669
                ],
                [
                    0.1388888888888889
                ],
                [
                    0.1111111111111111
                ],
                [
                    0.08333333333333333
                ],
                [
                    0.05555555555555555
                ],
                [
                    0.027777777777777776
                ]
            ],
            "normal": [
                0,
                0,
                0.027777777777777776,
                0.05555555555555555,
                0.08333333333333333,
                0.1111111111111111,
                0.1388888888888889,
                0.16666666666666669,
                0.1388888888888889,
                0.1111111111111111,
                0.08333333333333333,
                0.05555555555555555,
                0.027777777777777776
            ]
        };
        assert.deepEqual(attacks, expected, "attacks");
    });

    QUnit.test('integer sum', function(assert) {
        var hit_dice = '1+2';

        var attacks = parse_dice_prob_array(hit_dice, 1);

        var expected = {
            "mortal": [
                [
                    0.0
                ],
                [
                    0.0
                ],
                [
                    0.0
                ],
                [
                    1.0
                ]
            ],
            "normal": [
                0.0,
                0.0,
                0.0,
                1.0
            ]
        };
        assert.deepEqual(attacks, expected, "attacks");
    });

    QUnit.test('two dice sum', function(assert) {
        var hit_dice = 'd6+d6';

        var attacks = parse_dice_prob_array(hit_dice, 1);

        var expected = {
            "mortal": [
                [
                    0
                ],
                [
                    0
                ],
                [
                    0.027777777777777776
                ],
                [
                    0.05555555555555555
                ],
                [
                    0.08333333333333333
                ],
                [
                    0.1111111111111111
                ],
                [
                    0.1388888888888889
                ],
                [
                    0.16666666666666669
                ],
                [
                    0.1388888888888889
                ],
                [
                    0.1111111111111111
                ],
                [
                    0.08333333333333333
                ],
                [
                    0.05555555555555555
                ],
                [
                    0.027777777777777776
                ]
            ],
            "normal": [
                0,
                0,
                0.027777777777777776,
                0.05555555555555555,
                0.08333333333333333,
                0.1111111111111111,
                0.1388888888888889,
                0.16666666666666669,
                0.1388888888888889,
                0.1111111111111111,
                0.08333333333333333,
                0.05555555555555555,
                0.027777777777777776
            ]
        };
        assert.deepEqual(attacks, expected, "attacks");
    });

    QUnit.test('complex sum', function(assert) {
        var hit_dice = '2d6+1+0';

        var attacks = parse_dice_prob_array(hit_dice, 1);

        var expected = {
            "mortal": [
                [
                    0
                ],
                [
                    0
                ],
                [
                    0
                ],
                [
                    0.027777777777777776
                ],
                [
                    0.05555555555555555
                ],
                [
                    0.08333333333333333
                ],
                [
                    0.1111111111111111
                ],
                [
                    0.1388888888888889
                ],
                [
                    0.16666666666666669
                ],
                [
                    0.1388888888888889
                ],
                [
                    0.1111111111111111
                ],
                [
                    0.08333333333333333
                ],
                [
                    0.05555555555555555
                ],
                [
                    0.027777777777777776
                ]
            ],
            "normal": [
                0,
                0,
                0,
                0.027777777777777776,
                0.05555555555555555,
                0.08333333333333333,
                0.1111111111111111,
                0.1388888888888889,
                0.16666666666666669,
                0.1388888888888889,
                0.1111111111111111,
                0.08333333333333333,
                0.05555555555555555,
                0.027777777777777776
            ]
        };
        assert.deepEqual(attacks, expected, "attacks");
    });

    QUnit.module('do_hits');

    QUnit.test('one basic hit roll', function(assert) {
        var hit_stat = 5;
        var hit_mod = 0;
        var hit_dice = '1';
        var hit_reroll = '';
        var hit_abilities = {};

        var attacks = parse_dice_prob_array(hit_dice, 1);
        var damage_prob = parse_dice_prob_array('1', 1).normal;
        var hit_prob = success_chance(hit_stat, 6, hit_mod);

        var hits = do_hits(hit_stat, hit_mod, hit_reroll, attacks, hit_abilities, damage_prob, hit_prob);

        var expected = {
            "mortal": [
                [
                    0.6666666666666667
                ],
                [
                    0.3333333333333333
                ]
            ],
            "normal": [
                0.6666666666666667,
                0.3333333333333333
            ]
        };
        assert.deepEqual(hits, expected, "hits");
    });

    QUnit.test('one hit roll with mortals', function(assert) {
        var hit_stat = 5;
        var hit_mod = 0;
        var hit_dice = '1';
        var hit_reroll = '';
        var hit_abilities = {
            'mortal': true
        };

        var attacks = parse_dice_prob_array(hit_dice, 1);
        var damage_prob = parse_dice_prob_array('1', 1).normal;
        var hit_prob = success_chance(hit_stat, 6, hit_mod);

        var hits = do_hits(hit_stat, hit_mod, hit_reroll, attacks, hit_abilities, damage_prob, hit_prob);

        var expected = {
            "mortal": [
                [
                    0.6666666666666667,
                    0.16666666666666666
                ],
                [
                    0.16666666666666666
                ]
            ],
            "normal": [
                0.8333333333333334,
                0.16666666666666666
            ]
        };
        assert.deepEqual(hits, expected, "hits");
    });

    QUnit.test('one hit roll with extra attacks', function(assert) {
        var hit_stat = 5;
        var hit_mod = 0;
        var hit_dice = '1';
        var hit_reroll = '';
        var hit_abilities = {
            '+hit': '1'
        };

        var attacks = parse_dice_prob_array(hit_dice, 1);
        var damage_prob = parse_dice_prob_array('1', 1).normal;
        var hit_prob = success_chance(hit_stat, 6, hit_mod);

        var hits = do_hits(hit_stat, hit_mod, hit_reroll, attacks, hit_abilities, damage_prob, hit_prob);

        var expected = {
            "mortal": [
                [
                    0.6666666666666667
                ],
                [
                    0.16666666666666666
                ],
                [
                    0.16666666666666666
                ]
            ],
            "normal": [
                0.6666666666666667,
                0.16666666666666666,
                0.16666666666666666
            ]
        };
        assert.deepEqual(hits, expected, "hits");
    });

    QUnit.test('one hit roll with extra roll', function(assert) {
        var hit_stat = 5;
        var hit_mod = 0;
        var hit_dice = '1';
        var hit_reroll = '';
        var hit_abilities = {
            '+roll': '1'
        };

        var attacks = parse_dice_prob_array(hit_dice, 1);
        var damage_prob = parse_dice_prob_array('1', 1).normal;
        var hit_prob = success_chance(hit_stat, 6, hit_mod);

        var hits = do_hits(hit_stat, hit_mod, hit_reroll, attacks, hit_abilities, damage_prob, hit_prob);

        var expected = {
            "mortal": [
                [
                    0.6666666666666667
                ],
                [
                    0.2777777777777778
                ],
                [
                    0.05555555555555555
                ]
            ],
            "normal": [
                0.6666666666666667,
                0.2777777777777778,
                0.05555555555555555
            ]
        };
        assert.deepEqual(hits, expected, "hits");
    });

    QUnit.test('one hit roll with variable extra attacks', function(assert) {
        var hit_stat = 5;
        var hit_mod = 0;
        var hit_dice = '1';
        var hit_reroll = '';
        var hit_abilities = {
            '+hit': 'd3'
        };

        var attacks = parse_dice_prob_array(hit_dice, 1);
        var damage_prob = parse_dice_prob_array('1', 1).normal;
        var hit_prob = success_chance(hit_stat, 6, hit_mod);

        var hits = do_hits(hit_stat, hit_mod, hit_reroll, attacks, hit_abilities, damage_prob, hit_prob);

        var expected = {
            "mortal": [
                [
                    0.6666666666666667
                ],
                [
                    0.16666666666666666
                ],
                [
                    0.05555555555555555
                ],
                [
                    0.05555555555555555
                ],
                [
                    0.05555555555555555
                ]
            ],
            "normal": [
                0.6666666666666667,
                0.16666666666666666,
                0.05555555555555555,
                0.05555555555555555,
                0.05555555555555555
            ]
        };
        assert.deepEqual(hits, expected, "hits");
    });

    QUnit.test('one hit roll with reroll 1', function(assert) {
        var hit_stat = 5;
        var hit_mod = 0;
        var hit_dice = '1';
        var hit_reroll = '1';
        var hit_abilities = {};

        var attacks = parse_dice_prob_array(hit_dice, 1);
        var damage_prob = parse_dice_prob_array('1', 1).normal;
        var hit_prob = success_chance(hit_stat, 6, hit_mod);

        hit_prob = do_rerolls(hit_prob, hit_reroll);

        var hits = do_hits(hit_stat, hit_mod, hit_reroll, attacks, hit_abilities, damage_prob, hit_prob);

        var expected = {
            "mortal": [
                [
                    0.6111111111111112
                ],
                [
                    0.38888888888888884
                ]
            ],
            "normal": [
                0.6111111111111112,
                0.38888888888888884
            ]
        };
        assert.deepEqual(hits, expected, "hits");
    });

    QUnit.test('one hit roll with reroll failed', function(assert) {
        var hit_stat = 5;
        var hit_mod = 0;
        var hit_dice = '1';
        var hit_reroll = 'fail';
        var hit_abilities = {};

        var attacks = parse_dice_prob_array(hit_dice, 1);
        var damage_prob = parse_dice_prob_array('1', 1).normal;
        var hit_prob = success_chance(hit_stat, 6, hit_mod);
        hit_prob = do_rerolls(hit_prob, hit_reroll);

        var hits = do_hits(hit_stat, hit_mod, hit_reroll, attacks, hit_abilities, damage_prob, hit_prob);

        var expected = {
            "mortal": [
                [
                    0.4444444444444444
                ],
                [
                    0.5555555555555556
                ]
            ],
            "normal": [
                0.4444444444444444,
                0.5555555555555556
            ]
        };
        assert.deepEqual(hits, expected, "hits");
    });

    QUnit.test('one hit roll with reroll non-crit', function(assert) {
        var hit_stat = 5;
        var hit_mod = 0;
        var hit_dice = '1';
        var hit_reroll = 'noncrit';
        var hit_abilities = {};

        var attacks = parse_dice_prob_array(hit_dice, 1);
        var damage_prob = parse_dice_prob_array('1', 1).normal;
        var hit_prob = success_chance(hit_stat, 6, hit_mod);
        hit_prob = do_rerolls(hit_prob, hit_reroll);

        var hits = do_hits(hit_stat, hit_mod, hit_reroll, attacks, hit_abilities, damage_prob, hit_prob);

        var expected = {
            "mortal": [
                [
                    0.5555555555555556
                ],
                [
                    0.4444444444444444
                ]
            ],
            "normal": [
                0.5555555555555556,
                0.4444444444444444
            ]
        };
        assert.deepEqual(hits, expected, "hits");
    });

    QUnit.module('do_wounds');

    QUnit.test('one basic wound roll', function(assert) {
        var wound_stat = 5;
        var wound_mod = 0;
        var wound_crit = 6;
        var wound_reroll = '';
        var wound_abilities = {};
        var hit_abilities = {};
        var hit_prob = null;

        var wound_prob = calc_wound_prob(wound_stat, wound_crit, wound_mod, wound_reroll, hit_abilities, hit_prob);
        var damage_prob = parse_dice_prob_array('1', 1).normal;
        var hits = {
            "mortal": [
                [
                    0.6666666666666667
                ],
                [
                    0.3333333333333333
                ]
            ],
            "normal": [
                0.6666666666666667,
                0.3333333333333333
            ]
        };

        var wounds = do_wounds(wound_stat, wound_mod, wound_reroll, wound_prob, hits, wound_abilities, damage_prob);

        var expected = {
            "mortal": [
                [
                    0.888888888888889
                ],
                [
                    0.1111111111111111
                ]
            ],
            "normal": [
                0.888888888888889,
                0.1111111111111111
            ]
        };
        assert.deepEqual(wounds, expected, "wounds");
    });

    QUnit.test('one wound roll with mortals', function(assert) {
        var wound_stat = 5;
        var wound_mod = 0;
        var wound_crit = 6;
        var wound_reroll = '';
        var wound_abilities = {
            'mortal': true
        };
        var hit_abilities = {};
        var hit_prob = null;

        var wound_prob = calc_wound_prob(wound_stat, wound_crit, wound_mod, wound_reroll, hit_abilities, hit_prob);
        var damage_prob = parse_dice_prob_array('1', 1).normal;
        var hits = {
            "mortal": [
                [
                    0.6666666666666667
                ],
                [
                    0.3333333333333333
                ]
            ],
            "normal": [
                0.6666666666666667,
                0.3333333333333333
            ]
        };

        var wounds = do_wounds(wound_stat, wound_mod, wound_reroll, wound_prob, hits, wound_abilities, damage_prob);

        var expected = {
            "mortal": [
                [
                    0.888888888888889,
                    0.05555555555555555
                ],
                [
                    0.05555555555555555
                ]
            ],
            "normal": [
                0.9444444444444445,
                0.05555555555555555
            ]
        };
        assert.deepEqual(wounds, expected, "wounds");
    });

    QUnit.test('one wound roll with improved crit range', function(assert) {
        var wound_stat = 5;
        var wound_mod = 0;
        var wound_crit = 4;
        var wound_reroll = '';
        var wound_abilities = {
            'mortal': true
        };
        var hit_abilities = {};
        var hit_prob = null;

        var wound_prob = calc_wound_prob(wound_stat, wound_crit, wound_mod, wound_reroll, hit_abilities, hit_prob);
        var damage_prob = parse_dice_prob_array('1', 1).normal;
        var hits = {
            "mortal": [
                [
                    0.6666666666666667
                ],
                [
                    0.3333333333333333
                ]
            ],
            "normal": [
                0.6666666666666667,
                0.3333333333333333
            ]
        };

        var wounds = do_wounds(wound_stat, wound_mod, wound_reroll, wound_prob, hits, wound_abilities, damage_prob);

        var expected = {
            "mortal": [
                [
                    0.8333333333333334,
                    0.16666666666666666
                ],
                [
                    0
                ]
            ],
            "normal": [
                1,
                0
            ]
        };
        assert.deepEqual(wounds, expected, "wounds");
    });

    QUnit.test('one wound roll with reroll 1', function(assert) {
        var wound_stat = 5;
        var wound_mod = 0;
        var wound_crit = 6;
        var wound_reroll = '1';
        var wound_abilities = {};
        var hit_abilities = {};
        var hit_prob = null;

        var wound_prob = calc_wound_prob(wound_stat, wound_crit, wound_mod, wound_reroll, hit_abilities, hit_prob);
        var damage_prob = parse_dice_prob_array('1', 1).normal;
        var hits = {
            "mortal": [
                [
                    0.6666666666666667
                ],
                [
                    0.3333333333333333
                ]
            ],
            "normal": [
                0.6666666666666667,
                0.3333333333333333
            ]
        };

        var wounds = do_wounds(wound_stat, wound_mod, wound_reroll, wound_prob, hits, wound_abilities, damage_prob);

        var expected = {
            "mortal": [
                [
                    0.8703703703703705
                ],
                [
                    0.1296296296296296
                ]
            ],
            "normal": [
                0.8703703703703705,
                0.1296296296296296
            ]
        };
        assert.deepEqual(wounds, expected, "wounds");
    });

    QUnit.test('one wound roll with reroll failed', function(assert) {
        var wound_stat = 5;
        var wound_mod = 0;
        var wound_crit = 6;
        var wound_reroll = 'fail';
        var wound_abilities = {};
        var hit_abilities = {};
        var hit_prob = null;

        var wound_prob = calc_wound_prob(wound_stat, wound_crit, wound_mod, wound_reroll, hit_abilities, hit_prob);
        var damage_prob = parse_dice_prob_array('1').normal;
        var hits = {
            "mortal": [
                [
                    0.6666666666666667
                ],
                [
                    0.3333333333333333
                ]
            ],
            "normal": [
                0.6666666666666667,
                0.3333333333333333
            ]
        };

        var wounds = do_wounds(wound_stat, wound_mod, wound_reroll, wound_prob, hits, wound_abilities, damage_prob);

        var expected = {
            "mortal": [
                [
                    0.8148148148148149
                ],
                [
                    0.18518518518518517
                ]
            ],
            "normal": [
                0.8148148148148149,
                0.18518518518518517
            ]
        };
        assert.deepEqual(wounds, expected, "wounds");
    });

    QUnit.test('one wound roll with reroll non-crit', function(assert) {
        var wound_stat = 5;
        var wound_mod = 0;
        var wound_crit = 6;
        var wound_reroll = 'noncrit';
        var wound_abilities = {};
        var hit_abilities = {};
        var hit_prob = null;

        var wound_prob = calc_wound_prob(wound_stat, wound_crit, wound_mod, wound_reroll, hit_abilities, hit_prob);
        var damage_prob = parse_dice_prob_array('1').normal;
        var hits = {
            "mortal": [
                [
                    0.6666666666666667
                ],
                [
                    0.3333333333333333
                ]
            ],
            "normal": [
                0.6666666666666667,
                0.3333333333333333
            ]
        };

        var wounds = do_wounds(wound_stat, wound_mod, wound_reroll, wound_prob, hits, wound_abilities, damage_prob);

        var expected = {
            "mortal": [
                [
                    0.8518518518518519
                ],
                [
                    0.14814814814814814
                ]
            ],
            "normal": [
                0.8518518518518519,
                0.14814814814814814
            ]
        };
        assert.deepEqual(wounds, expected, "wounds");
    });

    QUnit.test('one wound roll with reroll non-crit, extended crit range', function(assert) {
        var wound_stat = 5;
        var wound_mod = 0;
        var wound_crit = 5;
        var wound_reroll = 'noncrit';
        var wound_abilities = {};
        var hit_abilities = {};
        var hit_prob = null;

        var wound_prob = calc_wound_prob(wound_stat, wound_crit, wound_mod, wound_reroll, hit_abilities, hit_prob);
        var damage_prob = parse_dice_prob_array('1').normal;
        var hits = {
            "mortal": [
                [
                    0.6666666666666667
                ],
                [
                    0.3333333333333333
                ]
            ],
            "normal": [
                0.6666666666666667,
                0.3333333333333333
            ]
        };

        var wounds = do_wounds(wound_stat, wound_mod, wound_reroll, wound_prob, hits, wound_abilities, damage_prob);

        var expected = {
            "mortal": [
                [
                    0.8148148148148149
                ],
                [
                    0.18518518518518517
                ]
            ],
            "normal": [
                0.8148148148148149,
                0.18518518518518517
            ]
        };
        assert.deepEqual(wounds, expected, "wounds");
    });

    QUnit.test('one hit roll with reroll non-crit and autowound on 6, wound roll', function(assert) {
        var hit_stat = 3;
        var hit_mod = 0;
        var hit_dice = '1';
        var hit_reroll = 'noncrit';
        var hit_abilities = {
            'autowound': true
        };

        var attacks = parse_dice_prob_array(hit_dice);
        var damage_prob = parse_dice_prob_array('1').normal;
        var hit_prob = success_chance(hit_stat, 6, hit_mod);
        hit_prob = do_rerolls(hit_prob, hit_reroll);
        var hits = do_hits(hit_stat, hit_mod, hit_reroll, attacks, hit_abilities, damage_prob, hit_prob);

        var wound_stat = 5;
        var wound_mod = 0;
        var wound_crit = 6;
        var wound_reroll = '';
        var wound_abilities = {};
        var wound_prob = calc_wound_prob(wound_stat, wound_crit, wound_mod, wound_reroll, hit_abilities, hit_prob);
        var wounds = do_wounds(wound_stat, wound_mod, wound_reroll, wound_prob, hits, wound_abilities, damage_prob);

        var expected = 	{
          "mortal": [
            [
              0.5555555555555556
            ],
            [
              0.4444444444444445
            ]
          ],
          "normal": [
            0.5555555555555556,
            0.4444444444444445
          ]
        };
        assert.deepEqual(wounds, expected, "wounds");
    });

    QUnit.module('saving throws');

    QUnit.test('Two saves at 3+', function(assert) {
        var save_stat = 3;
        var invuln_stat = null;
        var ap_val = 0;
        var save_mod = 0;
        var cover = 0;
        var cover_max = 0;
        var save_reroll = '';
        var wound_abilities = {
        };
        var wounds = {
            normal: [0, 0, 1],
            mortal: [
                [0],
                [0],
                [1]
            ]
        };
        var wound_prob = {
            "pass_chance": 1,
            "fail_chance": 0,
            "six_chance": 0
        };

        var unsaved = do_saves(save_stat, invuln_stat, ap_val, save_mod, cover, cover_max, save_reroll, wound_abilities, wounds, wound_prob);

        var expected = {
            "mortal": [
                [
                    0.4444444444444444
                ],
                [
                    0.4444444444444445
                ],
                [
                    0.11111111111111113
                ]
            ],
            "normal": [
                0.4444444444444444,
                0.4444444444444445,
                0.11111111111111113
            ]
        };
        assert.deepEqual(unsaved, expected, "unsaved");
    });

    QUnit.test('Two saves at 3+ (AP -4)', function(assert) {
        var save_stat = 3;
        var invuln_stat = null;
        var ap_val = 4;
        var save_mod = 0;
        var cover = 0;
        var cover_max = 0;
        var save_reroll = '';
        var wound_abilities = {
        };
        var wounds = {
            normal: [0, 0, 1],
            mortal: [
                [0],
                [0],
                [1]
            ]
        };
        var wound_prob = {
            "pass_chance": 1,
            "fail_chance": 0,
            "six_chance": 0
        };

        var unsaved = do_saves(save_stat, invuln_stat, ap_val, save_mod, cover, cover_max, save_reroll, wound_abilities, wounds, wound_prob);

        var expected = {
            "mortal": [
                [0],
                [0],
                [1]
            ],
            "normal": [
                0,
                0,
                1
            ]
        };
        assert.deepEqual(unsaved, expected, "unsaved");
    });


    QUnit.test('Two saves at 3+ (AP -3), invuln 5+', function(assert) {
        var save_stat = 3;
        var invuln_stat = 5;
        var ap_val = 3;
        var save_mod = 0;
        var cover = 0;
        var cover_max = 0;
        var save_reroll = '';
        var wound_abilities = {
        };
        var wounds = {
            normal: [0, 0, 1],
            mortal: [
                [0],
                [0],
                [1]
            ]
        };
        var wound_prob = {
            "pass_chance": 1,
            "fail_chance": 0,
            "six_chance": 0
        };

        var unsaved = do_saves(save_stat, invuln_stat, ap_val, save_mod, cover, cover_max, save_reroll, wound_abilities, wounds, wound_prob);

        var expected = {
            "mortal": [
                [
                    0.11111111111111106
                ],
                [
                    0.4444444444444444
                ],
                [
                    0.44444444444444453
                ]
            ],
            "normal": [
                0.11111111111111106,
                0.4444444444444444,
                0.44444444444444453
            ]
        };
        assert.deepEqual(unsaved, expected, "unsaved");
    });

    QUnit.module('damage & kills');

    QUnit.test('40K multiwound', function(assert) {
        var damage_val = 'd3';
        var wound_val = '2';
        var fnp = null;

        var damage_prob = parse_dice_prob_array(damage_val, 1).normal;
        var unsaved = {
            normal: [0, 0, 1],
            mortal: [
                [0],
                [0],
                [1]
            ]
        };

        var damage = do_damage(damage_val, fnp, damage_prob, unsaved);

        var expected_damage = {
            "normal": [
                0,
                0,
                0.1111111111111111,
                0.2222222222222222,
                0.3333333333333333,
                0.2222222222222222,
                0.1111111111111111
            ]
        };
        assert.deepEqual(damage, expected_damage, "damage");

        var kills = do_killed_40k(damage_prob, fnp, unsaved, wound_val);

        var expected_kills = {
            "normal": [
                0,
                0.5555555555555556,
                0.4444444444444444
            ]
        };
        assert.deepEqual(kills, expected_kills, "kills");
    });

    QUnit.test('AOS multiwound', function(assert) {
        var damage_val = 'd3';
        var wound_val = '2';
        var fnp = null;

        var damage_prob = parse_dice_prob_array(damage_val, 1).normal;
        var unsaved = {
            normal: [0, 0, 1],
            mortal: [
                [0],
                [0],
                [1]
            ]
        };

        var damage = do_damage(damage_val, fnp, damage_prob, unsaved);

        var expected_damage = {
            "normal": [
                0,
                0,
                0.1111111111111111,
                0.2222222222222222,
                0.3333333333333333,
                0.2222222222222222,
                0.1111111111111111
            ]
        };
        assert.deepEqual(damage, expected_damage, "damage");

        var kills = do_killed_aos(damage, wound_val);

        var expected_kills = {
            "normal": [
                0,
                0.3333333333333333,
                0.5555555555555556,
                0.1111111111111111
            ]
        };
        assert.deepEqual(kills, expected_kills, "kills");
    });

    QUnit.module('Full Stack');

    QUnit.test('6 attacks, mortals on hits and wounds', function(assert) {
        var hit_stat = 4;
        var hit_mod = 0;
        var hit_dice = '6';
        var hit_reroll = '';
        var hit_abilities = {
            'mortal': true
        };
        var wound_stat = 4;
        var wound_mod = 0;
        var wound_crit = 6;
        var wound_reroll = '';
        var wound_abilities = {
            'mortal': true
        };
        var save_stat = '3';
        var invuln_stat = '';
        var ap_val = '';
        var save_mod = 0;
        var cover = false;
        var save_reroll = '';
        var fnp = '';
        var wound_val = '1';

        var attacks = parse_dice_prob_array(hit_dice, 1);
        var damage_value = '1';
        var damage_prob = parse_dice_prob_array(damage_value, 1).normal;
        var hit_prob = success_chance(hit_stat, 6, hit_mod);

        var hits = do_hits(hit_stat, hit_mod, hit_reroll, attacks, hit_abilities, damage_prob, hit_prob);

        var expected_hits = {
            "mortal": [
                [
                    0.015625,
                    0.03125,
                    0.026041666666666664,
                    0.011574074074074072,
                    0.002893518518518518,
                    0.00038580246913580234,
                    0.000021433470507544577
                ],
                [
                    0.0625,
                    0.10416666666666667,
                    0.06944444444444445,
                    0.023148148148148143,
                    0.0038580246913580245,
                    0.00025720164609053495
                ],
                [
                    0.10416666666666669,
                    0.13888888888888892,
                    0.06944444444444445,
                    0.015432098765432098,
                    0.001286008230452675
                ],
                [
                    0.09259259259259262,
                    0.09259259259259262,
                    0.03086419753086421,
                    0.0034293552812071334
                ],
                [
                    0.04629629629629632,
                    0.03086419753086421,
                    0.005144032921810701
                ],
                [
                    0.012345679012345685,
                    0.004115226337448562
                ],
                [
                    0.0013717421124828542
                ]
            ],
            "normal": [
                0.0877914951989026,
                0.2633744855967079,
                0.32921810699588483,
                0.2194787379972566,
                0.08230452674897124,
                0.016460905349794247,
                0.0013717421124828542
            ]
        };
        assert.deepEqual(hits, expected_hits, "hits");

        var wound_prob = calc_wound_prob(wound_stat, wound_crit, wound_mod, wound_reroll, hit_abilities, hit_prob);
        var wounds = do_wounds(wound_stat, wound_mod, wound_reroll, wound_prob, hits, wound_abilities, damage_prob);

        var expected_wounds = {
            "mortal": [
                [
                    0.08779149519890263,
                    0.17558299039780526,
                    0.1463191586648377,
                    0.0650307371843723,
                    0.016257684296093075,
                    0.0021676912394790766,
                    0.00012042729108217092
                ],
                [
                    0.08779149519890264,
                    0.14631915866483775,
                    0.09754610577655849,
                    0.03251536859218616,
                    0.005419228098697693,
                    0.0003612818732465129
                ],
                [
                    0.036579789666209436,
                    0.04877305288827925,
                    0.024386526444139623,
                    0.005419228098697695,
                    0.0004516023415581411
                ],
                [
                    0.008128842148046544,
                    0.008128842148046543,
                    0.002709614049348848,
                    0.00030106822770542747
                ],
                [
                    0.0010161052685058183,
                    0.0006774035123372122,
                    0.00011290058538953536
                ],
                [
                    0.00006774035123372121,
                    0.000022580117077907072
                ],
                [
                    0.0000018816764231589235
                ]
            ],
            "normal": [
                0.4932701842725722,
                0.3699526382044292,
                0.11561019943888416,
                0.019268366573147365,
                0.0018064093662325657,
                0.00009032046831162829,
                0.0000018816764231589235
            ]
        };
        assert.deepEqual(wounds, expected_wounds, "wounds");

        var unsaved = do_saves(save_stat, invuln_stat, ap_val, save_mod, cover, null, save_reroll, wound_abilities, wounds, wound_prob);

        var expected_unsaved = {
            "mortal": [
                [
                    0.1915757707012368,
                    0.3364257436704646,
                    0.2461651782954619,
                    0.09606445982261926,
                    0.02108732044886764,
                    0.002468759467184504,
                    0.00012042729108217092
                ],
                [
                    0.02803547863920538,
                    0.04102752971591031,
                    0.024016114955654817,
                    0.007029106816289213,
                    0.0010286497779935433,
                    0.000060213645541085465
                ],
                [
                    0.0017094804048295965,
                    0.0020013429129712343,
                    0.0008786383520361516,
                    0.00017144162966559057,
                    0.000012544509487726136
                ],
                [
                    0.00005559285869364541,
                    0.0000488132417797862,
                    0.000014286802472132549,
                    0.0000013938343875251263
                ],
                [
                    0.0000010169425370788793,
                    5.952834363388562e-7,
                    8.711464922032041e-8
                ],
                [
                    9.921390605647601e-9,
                    2.9038216406773462e-9
                ],
                [
                    4.033085612051871e-11
                ]
            ],
            "normal": [
                0.893907659696917,
                0.10119709355059435,
                0.004773447808990299,
                0.0001200867373330893,
                0.0000016993406226380559,
                1.2825212246324947e-8,
                4.033085612051871e-11
            ]
        };
        assert.deepEqual(unsaved, expected_unsaved, "unsaved");

        var damage = do_damage(damage_value, fnp, damage_prob, unsaved);
        var expected_damage = {
            "normal": [
                0.1915757707012368,
                0.36446122230967,
                0.2889021884162018,
                0.12213751054993896,
                0.02904489580150987,
                0.003683742882142715,
                0.00019466933930022476
            ]
        };
        assert.deepEqual(damage, expected_damage, "damage");

        // Models Killed (40K)
        var killed_40k = do_killed_40k(damage_prob, fnp, unsaved, wound_val);
        var expected_killed_40k = {
            "normal": [
                0.1915757707012368,
                0.36446122230967,
                0.2889021884162018,
                0.12213751054993896,
                0.02904489580150987,
                0.003683742882142715,
                0.00019466933930022476
            ]
        };
        assert.deepEqual(killed_40k, expected_killed_40k, "killed 40k");

        // Models Killed (AOS)
        var killed_aos = do_killed_aos(damage, wound_val);
        var expected_killed_aos = {
            "normal": [
                0.1915757707012368,
                0.36446122230967,
                0.2889021884162018,
                0.12213751054993896,
                0.02904489580150987,
                0.003683742882142715,
                0.00019466933930022476
            ]
        };
        assert.deepEqual(killed_aos, expected_killed_aos, "killed aos");
    });
}

