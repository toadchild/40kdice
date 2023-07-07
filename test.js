function qunit_test() {
    QUnit.hooks.beforeEach(function() {
        TEST_OVERRIDE = true;
    });

    QUnit.module('do_hits');

    QUnit.test('one basic hit roll', function(assert) {
        var hit_stat = 5;
        var hit_mod = 0;
        var hit_dice = '1';
        var hit_reroll = '';
        var hit_abilities = {};

        var attacks = dice_sum_prob_array(hit_dice);
        var damage_prob = dice_sum_prob_array('1').normal;
        var hit_prob = success_chance(hit_stat, hit_mod);

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
        assert.deepEqual(hits, expected);
    });

    QUnit.test('one hit roll with mortals', function(assert) {
        var hit_stat = 5;
        var hit_mod = 0;
        var hit_dice = '1';
        var hit_reroll = '';
        var hit_abilities = {
            'mortal': true
        };

        var attacks = dice_sum_prob_array(hit_dice);
        var damage_prob = dice_sum_prob_array('1').normal;
        var hit_prob = success_chance(hit_stat, hit_mod);

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
        assert.deepEqual(hits, expected);
    });

    QUnit.module('do_wounds');

    QUnit.test('one basic wound roll', function(assert) {
        var wound_stat = 5;
        var wound_mod = 0;
        var wound_reroll = '';
        var wound_abilities = {};
        var hit_abilities = {};
        var hit_prob = null;

        var wound_prob = calc_wound_prob(wound_stat, wound_mod, wound_reroll, hit_abilities, hit_prob);
        var damage_prob = dice_sum_prob_array('1').normal;
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
        assert.deepEqual(wounds, expected);
    });

    QUnit.test('one wound roll with mortals', function(assert) {
        var wound_stat = 5;
        var wound_mod = 0;
        var wound_reroll = '';
        var wound_abilities = {
            'mortal': true
        };
        var hit_abilities = {};
        var hit_prob = null;

        var wound_prob = calc_wound_prob(wound_stat, wound_mod, wound_reroll, hit_abilities, hit_prob);
        var damage_prob = dice_sum_prob_array('1').normal;
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
        assert.deepEqual(wounds, expected);
    });
}

