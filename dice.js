
function fetch_value(id) {
    var element = document.getElementById(id);
    if (element == null) {
        return null;
    }
    return element.value;
}

function fetch_int_value(id) {
    var value = fetch_value(id);
    return parseInt(value, 10);
}

function is_checked(id) {
    return document.getElementById(id).checked;
}

// Chance that a single die roll will pass.
// Returns an object containing several relevant probabilities.
function success_chance(stat, crit, modifier) {
    var ret = {};

    // No stat means auto-succeed, but nothing special triggers.
    if (isNaN(stat)) {
        ret.pass_chance = 1.0;
        ret.fail_chance = 0.0;
        ret.six_chance = 0.0;
        return ret;
    }

    if (isNaN(modifier)) {
        modifier = 0;
    }

    // The critical threshold value determines when we always succeed - normally a 6.
    // 1 always fails.
    if (crit != null) {
        if (crit < 2) {
            crit = 2;
        } else if (crit > 6) {
            crit = 6;
        }
    }

    // Apply modifier to stat naively.
    stat -= modifier;

    // Put modded stat in sane limits (2-7).
    if (stat < 2) {
        stat = 2;
    } else if (stat > 7) {
        stat = 7;
    }

    // Criticals always succeed.
    if (crit && stat > crit) {
        stat = crit;
    }

    ret.pass_chance = (7 - stat) / 6.0;
    ret.fail_chance = 1.0 - ret.pass_chance;
    if (crit != null) {
        ret.six_chance = (7 - crit) / 6.0;
    } else {
        ret.six_chance = 0;
    }

    return ret;
}

// Reroll 1s
// Returns new success probability struct with updated values.
function reroll_1(prob){
    var ret = {};

    // Natural one happens 1/6 of the time.
    ret.pass_chance = prob.pass_chance + prob.pass_chance / 6.0;
    ret.fail_chance = 1.0 - ret.pass_chance;
    ret.six_chance = prob.six_chance + prob.six_chance / 6.0;

    return ret;
}

// Reroll all failed rolls
// Returns new success probability struct with updated values.
function reroll(prob){
    var ret = {};

    ret.pass_chance = prob.pass_chance + prob.fail_chance * prob.pass_chance;
    ret.fail_chance = 1.0 - ret.pass_chance;
    ret.six_chance = prob.six_chance + prob.fail_chance * prob.six_chance;

    return ret;
}

// Reroll all non-critical rolls, even if they are successes
// Returns new success probability struct with updated values.
function reroll_noncrit(prob){
    var ret = {};

    noncrit_chance = 1.0 - prob.six_chance
    ret.pass_chance = prob.six_chance + noncrit_chance * prob.pass_chance;
    ret.fail_chance = 1.0 - ret.pass_chance;
    ret.six_chance = prob.six_chance + noncrit_chance * prob.six_chance;

    return ret;
}

// Shake off damage
// Returns a prob array reflecting the chance to ignore wounds.
function shake_damage(damage_prob, fnp) {
    var results = [];
    results.length = damage_prob.length;
    results.fill(0.0);
    results[0] = damage_prob[0];

    if (fnp) {
        // Ability to shake off individual points of damage
        if (fnp < 2) {
            fnp = 2;
        }
        if (fnp > 7) {
            fnp = 7;
        }

        var shake_prob = (7.0 - fnp) / 6.0;

        // Must work from left to right since we are moving results down.
        for(var d = 1; d < damage_prob.length; d++) {
            if (damage_prob[d] > 0) {
                // Copy base probability
                results[d] = damage_prob[d];

                // Binomial theorem; chance of shaking off n wounds
                for (var n = 1; n <= d; n++) {
                    var shake_n_prob = prob(d, n, shake_prob);
                    var delta = damage_prob[d] * shake_n_prob;
                    results[d] -= delta;
                    results[d - n] += delta;
                }
            }
        }
    } else {
        // No shake effect
        results = damage_prob;
    }

    return results;
}

function rolls_of_6_as_mortal(rolls, six_chance, damage_prob) {
    var results = {'normal': [], 'mortal': []};

    // Calculate base probability of a given number of mortal wounds.
    for (var w = 0; w < rolls.normal.length; w++) {
        // Wound of 6+ deals all damage as mortal wounds
        // Use binomial theorem to find out how likely it is to get n sixes on w dice.
        for (var n = 0; n <= w; n++) {
            var n_six_prob = prob(w, n, six_chance);

            if (results.normal[w - n] == null) {
                results.normal[w - n] = 0;
                results.mortal[w - n] = [0];
            }
            results.normal[w - n] += rolls.normal[w] * n_six_prob;

            var damage = roll_n_dice(n, damage_prob);
            for (var m = 0; m < rolls.mortal[w].length; m++) {
                if (results.mortal[w - n][m] == null) {
                    results.mortal[w - n][m] = 0;
                }

                // Distribute existing mortals with new damage.
                for (var d = 0; d < damage.length; d++) {
                    if (results.mortal[w - n][m + d] == null) {
                        results.mortal[w - n][m + d] = 0;
                    }

                    results.mortal[w - n][m + d] += rolls.mortal[w][m] * n_six_prob * damage[d];
                }
            }
        }
    }

    return results;
}

function rolls_of_6_add_mortal(rolls, six_chance) {
    var results = {'normal': [], 'mortal': []};

    for (var w = 0; w < rolls.normal.length; w++) {
        results.normal[w] = rolls.normal[w];
        results.mortal[w] = [];
        results.mortal[w].length = rolls.mortal.length;
        results.mortal[w].fill(0);

        // Roll of 6+ deals 1 mortal wound in addition to normal wounds
        // Use binomial theorem to find out how likely it is to get n sixes on w dice.
        for (var n = 0; n <= w; n++) {
            var n_six_prob = prob(w, n, six_chance);

            for (var m = 0; m < rolls.mortal[w].length; m++) {
                if (results.mortal[w][m + n] == null) {
                    results.mortal[w][m + n] = 0;
                }

                results.mortal[w][m] += rolls.mortal[w][m] * n_six_prob;

                // Add additional mortals
                results.mortal[w][m] -= rolls.mortal[w][m] * n_six_prob;
                results.mortal[w][m + n] += rolls.mortal[w][m] * n_six_prob;
            }
        }
    }
    return results;
}

function hits_of_6_add_hits(hits, bonus_hits_val, bonus_hit_chance, hit_six_chance) {
    var results = {'normal': [], 'mortal': []};

    // Parse the bonus hits into a distribution.
    bonus_hits_prob = parse_dice_prob_array(bonus_hits_val).normal;

    // Take hits from each column and move them to the right.
    for (var h = 0; h < hits.normal.length; h++) {
        if (results.normal[h] == null) {
            results.normal[h] = 0;
            results.mortal[h] = [0];
        }

        // Use binomial theorem to find out how likely it is to get n sixes on h dice.
        for (var n = 0; n <= h; n++) {
            var n_six_hit_prob = prob(h, n, hit_six_chance);

            // Iterate across a prob array for how many hits
            for (var bonus_hits = 0; bonus_hits < bonus_hits_prob.length; bonus_hits++) {
                var bonus_val_chance = bonus_hits_prob[bonus_hits];

                // Binomial again to see how many of the bonus hits hit.
                for (var b = 0; b <= bonus_hits * n; b++) {
                    if (results.normal[h + b] == null) {
                        results.normal[h + b] = 0;
                        results.mortal[h + b] = [0];
                    }

                    var b_prob = prob(bonus_hits * n, b, bonus_hit_chance);
                    var six_delta = hits.normal[h] * n_six_hit_prob * b_prob * bonus_val_chance;
                    results.normal[h + b] += six_delta;

                    if (results.mortal[h + b][0] == null) {
                        results.mortal[h + b][0] = 0;
                    }
                    results.mortal[h + b][0] += six_delta;
                }
            }
        }
    }
    return results;
}

function do_hits(hit_stat, hit_mod, hit_reroll, attacks, hit_abilities, damage_prob, hit_prob) {
    var hit_title;
    if (hit_prob.pass_chance == 1) {
        hit_title = 'auto-hit';
    } else {
        hit_title = 'hit on ' + hit_stat + '+';

        if (hit_mod) {
            var sign = '';
            if (hit_mod > 0) {
                sign = '+';
            }
            hit_title += ' (' + sign + hit_mod + ')';
        }
    }

    // Rerolls
    if (hit_reroll == 'fail') {
        hit_title += ', reroll misses';
    } else if (hit_reroll == '1') {
        hit_title += ', reroll 1s';
    } else if (hit_reroll == 'noncrit') {
        hit_title += ', reroll non-crits';
    }

    log_prob_array('Attacks', attacks);

    // Apply probability filter
    var hits = filter_prob_array(attacks, hit_prob.pass_chance);
    var hit_six_chance = hit_prob.six_chance / hit_prob.pass_chance;
    log_prob_array('Base Hits', hits);

    // Hits of six mortal wound effects
    // Apply these independently of generating additional hits
    if (hit_abilities['mortal']) {
        hits = rolls_of_6_as_mortal(hits, hit_six_chance, damage_prob);
        hit_title += ', 6s deal mortals';
        log_prob_array('Mortal Hits', hits);
    } else if (hit_abilities['+mortal']) {
        hits = rolls_of_6_add_mortal(hits, hit_six_chance);
        hit_title += ', 6s add 1 mortal';
        log_prob_array('+Mortal Hits', hits);
    }

    // Hit of six generates extra hits
    if (hit_abilities['+hit'] || hit_abilities['+roll']) {
        // Probability of a six given that we hit.
        var bonus_hits = 0;
        var bonus_hit_chance = 0;

        if (hit_abilities['+hit']) {
            bonus_hits = hit_abilities['+hit'];
            hit_title += ', 6s add ' + bonus_hits + ' extra hit(s)';
            bonus_hit_chance = 1.0;
        } else if (hit_abilities['+roll']) {
            bonus_hits = hit_abilities['+roll'];
            hit_title += ', 6s add ' + bonus_hits + ' hit roll(s)';
            bonus_hit_chance = hit_prob.pass_chance;
        }

        hits = hits_of_6_add_hits(hits, bonus_hits, bonus_hit_chance, hit_six_chance);
        log_prob_array('Sustained Hits', hits);
    }

    if (hit_abilities['autowound']) {
        hit_title += ', 6s autowound';
    }

    graph(hits, hit_title, 'hit');

    return hits;
}

function calc_wound_prob(wound_stat, wound_crit, wound_mod, wound_reroll, hit_abilities, hit_prob) {
    var wound_prob = success_chance(wound_stat, wound_crit, wound_mod);

    // Rerolls
    if (wound_reroll == 'fail') {
        wound_prob = reroll(wound_prob);
    } else if (wound_reroll == '1') {
        wound_prob = reroll_1(wound_prob);
    } else if (wound_reroll == 'noncrit') {
        wound_prob = reroll_noncrit(wound_prob);
    }

    // Auto-wound on roll of 6+
    // Only apply normal wound probability to lesser hits
    if (hit_abilities['autowound']) {
        var hit_six_chance = hit_prob.six_chance / hit_prob.pass_chance;
        wound_prob.pass_chance = 1.0 * hit_six_chance + wound_prob.pass_chance * (1.0 - hit_six_chance);
        wound_prob.fail_chance = wound_prob.fail_chance * (1.0 - hit_six_chance);
        wound_prob.six_chance = wound_prob.six_chance * (1.0 - hit_six_chance);
    }

    return wound_prob;
}

function do_wounds(wound_stat, wound_mod, wound_reroll, wound_prob, hits, wound_abilities, damage_prob) {
    var wound_title;
    if (wound_prob.pass_chance == 1) {
        wound_title = 'auto-wound';
    } else {
        wound_title = 'wound on ' + wound_stat + '+';
        if (wound_mod) {
            var sign = '';
            if (wound_mod > 0) {
                sign = '+';
            }
            wound_title += ' (' + sign + wound_mod + ')';
        }
    }

    // Rerolls
    if (wound_reroll == 'fail') {
        wound_title += ', reroll failed';
    } else if (wound_reroll == '1') {
        wound_title += ', reroll 1s';
    } else if (wound_reroll == 'noncrit') {
        wound_title += ', reroll non-crits';
    }

    // Apply probability filter
    var wounds = filter_prob_array(hits, wound_prob.pass_chance);
    log_prob_array('Wounds', wounds);

    // Calculate odds of getting mortal wounds.
    // Is a set of probability arrays keyed on the number of wounds.
    // Probability of a six given that we wound.
    var wound_six_chance = wound_prob.six_chance / wound_prob.pass_chance;
    if (wound_abilities['+mortal']) {
        wounds = rolls_of_6_add_mortal(wounds, wound_six_chance);
        wound_title += ', 6s add 1 mortal';
        log_prob_array('+Mortal Wounds', wounds);
    } else if (wound_abilities['mortal']) {
        wounds = rolls_of_6_as_mortal(wounds, wound_six_chance, damage_prob);
        wound_title += ', 6s deal mortals';
        log_prob_array('Mortal Wounds', wounds);
    }

    graph(wounds, wound_title, 'wound');

    return wounds;
}

function do_saves(save_stat, invuln_stat, ap_val, save_mod, cover, cover_max, save_reroll, wound_abilities, wounds, wound_prob) {
    // Always treat AP as negative
    ap_val = -Math.abs(ap_val);
    if (isNaN(save_mod)) {
        save_mod = 0;
    }
    if (isNaN(ap_val)) {
        ap_val = 0;
    }
    var total_save_mod = save_mod + ap_val;

    // in 40K, models with a 3+ or better save cannot claim cover against AP 0.
    if (cover_max && save_stat <= cover_max && ap_val == 0) {
        cover = false;
    }
    if (cover) {
        total_save_mod++;
    }

    // Save mod cannot be higher than +1.
    if (save_mod > 1) {
        save_mod = 1;
    }

    var use_invuln = false;

    // Auto-fail the save if no save stat given.
    if (isNaN(save_stat)) {
        save_stat = null;
    }
    if (isNaN(invuln_stat) || invuln_stat == null) {
        invuln_stat = null;
    }

    // Normal save.
    var save_prob = {
        pass_chance: 0.0,
        fail_chance: 1.0,
        six_chance: 0.0
    };
    var save_title;
    if (save_stat != null) {
        save_prob = success_chance(save_stat, null, total_save_mod);
        save_title = 'save of ' + save_stat + '+';
        if (total_save_mod) {
            var sign = '';
            if (total_save_mod > 0) {
                sign = '+';
            }
            save_title += ' (' + sign + total_save_mod + ')';
        }
        if (save_reroll == 'fail') {
            save_title += ', reroll failures';
            save_prob = reroll(save_prob);
        } else if (save_reroll == '1') {
            save_title += ', reroll 1s';
            save_prob = reroll_1(save_prob);
        }
    }

    // Invulnerable save; ignores AP and cover, but includes other modifiers.
    var invuln_prob = {
        pass_chance: 0.0,
        fail_chance: 1.0,
        six_chance: 0.0
    };
    var invuln_title;
    if (invuln_stat != null) {
        var invuln_prob = success_chance(invuln_stat, null, save_mod);
        var invuln_title = 'save of ' + invuln_stat + '++';
        if (save_mod) {
            var sign = '';
            if (save_mod > 0) {
                sign = '+';
            }
            invuln_title += ' (' + sign + save_mod + ')';
        }
        if (save_reroll == 'inv_fail') {
            invuln_title += ', reroll failures';
            invuln_prob = reroll(invuln_prob);
        } else if (save_reroll == 'inv_1') {
            invuln_title += ', reroll 1s';
            invuln_prob = reroll_1(invuln_prob);
        }
    }

    // wounds of 6 get additional AP
    if (wound_abilities['pierce']) {
        // Probability of a six given that we wound.
        var wound_six_chance = wound_prob.six_chance / wound_prob.pass_chance;
        var ap_mod = parseInt(wound_abilities['pierce'], 10);

        // calculate save chance with modified AP.
        var ap_save_prob = success_chance(save_stat, null, total_save_mod - ap_mod);
        if (save_reroll == 'fail') {
            ap_save_prob = reroll(ap_save_prob);
        } else if (save_reroll == '1') {
            ap_save_prob = reroll_1(ap_save_prob);
        }

        // But don't use it if it's worse than the invulnerable save.
        if (invuln_prob.pass_chance > ap_save_prob.pass_chance) {
            ap_save_prob = invuln_prob;
        }

        // Set the save chance as a weighted combination of normal hits
        // and AP-X hits.
        // 1 chance and 6 chance are no longer accurate.
        save_prob.pass_chance = wound_six_chance * ap_save_prob.pass_chance + (1 - wound_six_chance) * save_prob.pass_chance;
        save_prob.fail_chance = wound_six_chance * ap_save_prob.fail_chance + (1 - wound_six_chance) * save_prob.fail_chance;
    }

    // Use whichever save is better.  Includes rerolls.
    var unsaved_prob;
    var unsaved_title;
    if (invuln_prob.pass_chance > save_prob.pass_chance) {
        unsaved_prob = invuln_prob.fail_chance;
        unsaved_title = invuln_title;
    } else {
        unsaved_prob = save_prob.fail_chance;
        unsaved_title = save_title;
    }

    var unsaved;
    unsaved = filter_prob_array(wounds, unsaved_prob);

    if (unsaved_prob == 1) {
        unsaved_title = 'auto-fail save';
    }

    graph(unsaved, unsaved_title, 'unsaved');
    return unsaved;
}

function do_damage(damage_val, fnp, damage_prob, unsaved) {
    var damage_title = damage_val + ' damage';
    if (fnp) {
        damage_title += ' (shake on ' + fnp + '+)';
    }

    damage_prob = shake_damage(damage_prob, fnp);

    // Change of a mortal wound going through.
    var mortal_damage_chance = shake_damage([0, 1], fnp)[1];

    var damage = {'normal': []};
    // Apply damage based on how many hits there are.
    for(var n = 0; n < unsaved.normal.length; n++) {
        // Generate damage array for this many impacts.
        hit_damage = roll_n_dice(n, damage_prob);

        // Add to the damage output, scaled by our current probability.
        for (var d = 0; d < hit_damage.length; d++) {
            // Add extra damage points for mortal wounds.
            for (var m = 0; m < unsaved.mortal[n].length; m++) {
                for (var mortals = 0; mortals <= m; mortals++) {
                    var n_mortal_prob = prob(m, mortals, mortal_damage_chance);

                    // Total damage including mortal wounds
                    var dam = d + mortals;

                    if (damage.normal[dam] == null) {
                        damage.normal[dam] = 0;
                    }
                    damage.normal[dam] += hit_damage[d] * unsaved.mortal[n][m] * n_mortal_prob;
                }
            }
        }
    }

    graph(damage, damage_title, 'damage');
    return damage;
}

function do_killed_40k(damage_prob, fnp, unsaved, wound_val) {
    var killed = {'normal': []};
    var killed_title = 'models killed';
    damage_prob = shake_damage(damage_prob, fnp);
    var mortal_damage_chance = shake_damage([0, 1], fnp)[1];
    if (wound_val) {
        for(var n = 0; n < unsaved.normal.length; n++) {
            // Generate killed array for this many impacts.
            hit_killed = roll_n_dice_against_threshold(n, damage_prob, wound_val);

            // Add to the killed output, scaled by our current probability.
            for (var k = 0; k < hit_killed.length; k++) {
                for (var w = 0; w < hit_killed[k].length; w++) {
                    // Add extra kills for mortal wounds.
                    for (var m = 0; m < unsaved.mortal[n].length; m++) {
                        for (var mortals = 0; mortals <= m; mortals++) {
                            var n_mortal_prob = prob(m, mortals, mortal_damage_chance);

                            // Total kills; previously killed models + mortal wounds.
                            var kills = k + Math.floor((w + mortals) / wound_val);

                            if (killed.normal[kills] == null) {
                                killed.normal[kills] = 0;
                            }
                            killed.normal[kills] += hit_killed[k][w] * unsaved.mortal[n][m] * n_mortal_prob;
                        }
                    }
                }
            }
        }
    }

    graph(killed, killed_title, 'killed');
    return killed;
}

function do_killed_aos(damage, wound_val) {
    var killed = {'normal': []};
    var killed_title = 'models killed';
    if (wound_val) {
        for(var n = 0; n < damage.normal.length; n++) {
            var kills = Math.floor(n / wound_val);
            if (killed.normal[kills] == null) {
                killed.normal[kills] = 0;
            }
            killed.normal[kills] += damage.normal[n];
        }
    }

    graph(killed, killed_title, 'killed');
    return killed;
}

function roll_40k() {
    // Fetch all values up front
    var hit_dice = fetch_value('attacks');
    var hit_stat = fetch_int_value('bs');
    var hit_mod = fetch_int_value('hit_mod');
    var hit_reroll = fetch_value('hit_reroll');
    var hit_leth = is_checked('hit_leth');
    var hit_sus = fetch_value('hit_sus');
    var hit_crit = fetch_int_value('hit_crit') || 6;
    var hit_of_6 = fetch_value('hit_of_6');
    var s = fetch_int_value('s');
    var t = fetch_int_value('t');
    var wound_mod = fetch_int_value('wound_mod');
    var wound_reroll = fetch_value('wound_reroll');
    var wound_dev = is_checked('wound_dev');
    var wound_crit = fetch_int_value('wound_crit') || 6;
    var wound_of_6 = fetch_value('wound_of_6');
    var save_stat = fetch_int_value('save');
    var invuln_stat = fetch_int_value('invulnerable');
    var ap_val = fetch_int_value('ap');
    var save_mod = fetch_int_value('save_mod');
    var cover = is_checked('cover');
    var save_reroll = fetch_value('save_reroll');
    var damage_val = fetch_value('d');
    var wound_val = fetch_int_value('wounds');
    var fnp = fetch_int_value('fnp');

    var damage_prob = parse_dice_prob_array(damage_val).normal;

    // Number of attacks
    var attacks = parse_dice_prob_array(hit_dice);
    var attack_title = hit_dice + ' attacks';

    graph(attacks, attack_title, 'attack');

    // Hits
    if (hit_mod < -1) {
        hit_mod = -1;
    }else if (hit_mod > 1) {
        hit_mod = 1;
    }
    var hit_prob = success_chance(hit_stat, hit_crit, hit_mod);

    // Rerolls
    if (hit_reroll == 'fail') {
        hit_prob = reroll(hit_prob);
    } else if (hit_reroll == '1') {
        hit_prob = reroll_1(hit_prob);
    } else if (hit_reroll == 'noncrit') {
        hit_prob = reroll_noncrit(hit_prob);
    }

    var hit_abilities = {
        '+hit': hit_sus,
        'autowound': hit_leth,
        '+mortal': (hit_of_6 == '+mortal'),
        'mortal': (hit_of_6 == 'mortal')
    };
    var hits = do_hits(hit_stat, hit_mod, hit_reroll, attacks, hit_abilities, damage_prob, hit_prob);

    // Wounds
    var wound_stat;
    if (!s || !t) {
        wound_stat = Number.NaN;
    } else if (t >= s * 2) {
        wound_stat = 6;
    } else if (t > s) {
        wound_stat = 5;
    } else if (s >= t * 2) {
        wound_stat = 2;
    } else if (s > t) {
        wound_stat = 3;
    } else {
        wound_stat = 4;
    }
    var wound_abilities = {
        'mortal': wound_dev,
        '+mortal': (wound_of_6 == '+mortal')
    };
    if (wound_mod < -1) {
        wound_mod = -1;
    }else if (wound_mod > 1) {
        wound_mod = 1;
    }
    var wound_prob = calc_wound_prob(wound_stat, wound_crit, wound_mod, wound_reroll, hit_abilities, hit_prob);
    var wounds = do_wounds(wound_stat, wound_mod, wound_reroll, wound_prob, hits, wound_abilities, damage_prob);

    // Saves
    var unsaved = do_saves(save_stat, invuln_stat, ap_val, save_mod, cover, 3, save_reroll, wound_abilities, wounds, wound_prob);

    // Damage
    var damage = do_damage(damage_val, fnp, damage_prob, unsaved);

    // Models Killed
    var killed = do_killed_40k(damage_prob, fnp, unsaved, wound_val);

    generate_permalink_40k();
}

function roll_aos() {
    // Fetch all values up front
    var hit_dice = fetch_value('attacks');
    var hit_stat = fetch_int_value('hit');
    var hit_mod = fetch_int_value('hit_mod');
    var hit_reroll = fetch_value('hit_reroll');
    var hit_of_6 = fetch_value('hit_of_6');
    var wound_stat = fetch_int_value('wound');
    var wound_mod = fetch_int_value('wound_mod');
    var wound_reroll = fetch_value('wound_reroll');
    var wound_of_6 = fetch_value('wound_of_6');
    var save_stat = fetch_int_value('save');
    var rend_val = fetch_int_value('rend');
    var save_mod = fetch_int_value('save_mod');
    var cover = is_checked('cover');
    var save_reroll = fetch_value('save_reroll');
    var damage_val = fetch_value('d');
    var wound_val = fetch_int_value('wounds');
    var shake = fetch_value('shake');

    var damage_prob = parse_dice_prob_array(damage_val).normal;

    // Number of attacks
    var attacks = parse_dice_prob_array(hit_dice);
    var attack_title = hit_dice + ' attacks';

    graph(attacks, attack_title, 'attack');

    // Hits
    if (hit_mod < -1) {
        hit_mod = -1;
    }else if (hit_mod > 1) {
        hit_mod = 1;
    }
    var hit_prob = success_chance(hit_stat, 6, hit_mod);
    var hit_abilities = {};
    if (hit_of_6 == '1') {
        hit_abilities['+hit'] = '1';
    } else if (hit_of_6 == '2') {
        hit_abilities['+hit'] = '2';
    } else if (hit_of_6 == '1roll') {
        hit_abilities['+roll'] = '1';
    }
    hit_abilities['autowound'] = (hit_of_6 == 'autowound');
    hit_abilities['+mortal'] = (hit_of_6 == '+mortal');
    hit_abilities['mortal'] = (hit_of_6 == 'mortal');
    var hits = do_hits(hit_stat, hit_mod, hit_reroll, attacks, hit_abilities, damage_prob, hit_prob);

    // Wounds
    if (wound_mod < -1) {
        wound_mod = -1;
    }else if (wound_mod > 1) {
        wound_mod = 1;
    }
    var wound_prob = calc_wound_prob(wound_stat, 6, wound_mod, wound_reroll, hit_abilities, hit_prob);
    var wound_abilities = {};
    if (wound_of_6 == '-1') {
        wound_abilities['pierce'] = 1;
    } else if (wound_of_6 == '-3') {
        wound_abilities['pierce'] = 3;
    } else if (wound_of_6 == '-4') {
        wound_abilities['pierce'] = 4;
    }
    wound_abilities['+mortal'] = (wound_of_6 == '+mortal');
    wound_abilities['mortal'] = (wound_of_6 == 'mortal');
    var wounds = do_wounds(wound_stat, wound_mod, wound_reroll, wound_prob, hits, wound_abilities, damage_prob);

    // Saves
    var unsaved = do_saves(save_stat, null, rend_val, save_mod, cover, null, save_reroll, wound_abilities, wounds, wound_prob);

    // Damage
    var ward;
    if (shake == '6') {
        ward = 6;
    } else if (shake == '56') {
        ward = 5;
    }
    var damage = do_damage(damage_val, ward, damage_prob, unsaved);

    // Models Killed
    var killed = do_killed_aos(damage, wound_val);

    generate_permalink_aos();
}

// Binomial expansion.
function binom(n, k) {
    // n! / (k! * (n - k)!)

    // In order to avoid floating point over/under-flow, I need to intersperse
    // the operations.  This is less computationally efficient, since I'll do
    // a lot more floating point division, but it will help ensure that neither
    // the numerator nor denominator goes to "infinity".

    // Numerator is what is left after canceling out n! / (n - k)!
    // So (n - k + 1) * (n - k + 2) * ... * (n - 1) * n
    var numerator = [];
    for (var i = n - k + 1; i <= n; i++) {
        numerator[numerator.length] = i;
    }

    // Denominator is k!
    var denominator = [];
    for (var j = 2; j <= k; j++) {
        denominator[denominator.length] = j;
    }

    var result = 1.0;
    var length = Math.max(numerator.length, denominator.length);
    for (var i = 0; i < length; i++) {
        if (i < numerator.length) {
            result *= numerator[i];
        }
        if (i < denominator.length) {
            result /= denominator[i];
        }
    }

    return result;
}

// Probability of successes given a number of trials and a probability.
function prob(trials, successes, probability) {
    return binom(trials, successes) * Math.pow(probability, successes) * Math.pow(1 - probability, trials - successes);
}

// Takes a probability array, returns new probability array reduced by the
// specified probability of success.
function filter_prob_array(input_probs, probability) {
    var results = {'normal': [], 'mortal': []};

    for(var i = 0; i < input_probs.normal.length; i++) {
        // merge into master list based on how likely this many trials were
        for(var r = 0; r <= i; r++) {
            var trial_result = prob(i, r, probability);

            if (results.normal[r] == null) {
                results.normal[r] = 0;
                results.mortal[r] = [0];
            }
            results.normal[r] += input_probs.normal[i] * trial_result;

            // Any mortals that are here need to be distributed over the entire mortal distribution at the target
            if (input_probs.mortal[i]) {
                for (var m = 0; m < input_probs.mortal[i].length; m++) {
                    if (results.mortal[r][m] == null) {
                        results.mortal[r][m] = 0;
                    }
                    results.mortal[r][m] += input_probs.mortal[i][m] * trial_result;
                }
            }
        }
    }

    return results;
}

// Returns a probability array for a specified number of dice in nDs notation.
// Will also return a constant probability array if no 'd' is present.
// If one or more '+' is present, generates a probability array for each one and then
// sums them all together.
function parse_dice_prob_array(dice_str) {
    // Start with a die that always rolls 0.
    var die_prob = roll_const_die(0);

    var parts = dice_str.split('+');
    for (var v = 0; v < parts.length; v++) {
        var value = parts[v];
        var part_prob = roll_const_die(0);

        var i = value.toLowerCase().indexOf('d');
        // No 'd', return constant probability.
        if (i == -1) {
            part_prob = roll_const_die(value);
        } else {
            // Multiple uniform dice
            var n = parseInt(value.substring(0, i), 10);
            if (isNaN(n) || n <= 0) {
                n = 1;
            }
            var sides = parseInt(value.substring(i + 1), 10);
            if (isNaN(sides) || sides <= 0) {
                sides = 1;
            }

            var die_faces = [];
            die_faces[0] = 0;
            for (var i = 1; i <= sides; i++) {
                die_faces[i] = 1.0 / sides;
            }

            part_prob = roll_n_dice(n, die_faces);
        }
        die_prob = sum_dice_prob(die_prob, part_prob);
    }

    // Make it a proper prob array with 0 mortal wounds.
    var final_die_prob = {normal: die_prob, mortal: []};
    for (var w = 0; w < die_prob.length; w++) {
        final_die_prob.mortal[w] = [final_die_prob.normal[w]];
    }
    return final_die_prob;
}

// Generate a constant probability array
function roll_const_die(value) {
    var prob = [];
    prob.length = value;
    prob.fill(0);
    prob[prob.length] = 1;
    return prob;
}

// Roll n dice with the given probability distribution.
// http://ghostlords.com/2008/03/dice-rolling-2/
// Modified to support dice with non-uniform probabilities.
// Note that this includes dice that can roll a result of 0!
function roll_n_dice(n, die_prob) {
    // If we're rolling 0 dice, 100% chance of getting 0
    if (n <= 0) {
        return roll_const_die(0);
    }

    // Make a pair of buffers.  Preload the values for 1 die in each.
    // We only enter the loop for 2+ dice.
    var probs = [];
    var oldprobs = [];
    var sides = die_prob.length - 1;
    probs.length = n * sides + 1;
    oldprobs.length = n * sides + 1;
    probs.fill(0);
    oldprobs.fill(0);
    for (var i = 0; i <= sides; i++) {
        probs[i] = die_prob[i];
        oldprobs[i] = die_prob[i];
    }

    for (var d = 2; d <= n; d++) {
        // Clear working buffer
        probs = [];
        probs.length = n * sides + 1;
        probs.fill(0);

        // For each face of the new die...
        for (var i = 0; i <= sides; i++) {
            // Sum with old outcomes...
            for (var j = 0; j <= (d - 1) * sides; j++) {
                // Combine probabilities of [i] and [j] to get [i+j]
                probs[i + j] += die_prob[i] * oldprobs[j];
            }
        }
        oldprobs = probs;
    }

    return probs;
}

// Return a probability array that returns the sum of the two given dice.
// I'm ignoring mortal wounds for now, as this should only be called when creating new dice.
function sum_dice_prob(val1, val2) {
    var sum = [];
    sum.length = val1.length + val2.length - 1;
    sum.fill(0);

    for (var i = 0; i < val1.length; i++) {
        for (var j = 0; j < val2.length; j++) {
            sum[i + j] += val1[i] * val2[j];
        }
    }

    return sum;
}

// Variant of roll_n_dice that checks the total against a threshold.
// Used to efficiently calculate how many models are killed by n attacks.
// Return value is a 2D array:
//   1st index is number of successes (value >= threshold)
//   2nd index is the excess value accumulated
// Total probability for n successes is the sum of return[n]
function roll_n_dice_against_threshold(n, die_prob, threshold) {
    // If we're rolling 0 dice, 100% chance of getting 0
    if (n <= 0) {
        return [[1]];
    }

    // Make a pair of buffers.  Preload the values for 1 die in each.
    // We only enter the loop for 2+ dice.
    var sides = die_prob.length - 1;
    var probs = array_2d(2, threshold);
    var oldprobs = array_2d(2, threshold);
    for (var i = 0; i <= sides; i++) {
        if (i >= threshold) {
            probs[1][0] += die_prob[i];
            oldprobs[1][0] += die_prob[i];
        } else {
            probs[0][i] = die_prob[i];
            oldprobs[0][i] = die_prob[i];
        }
    }

    for (var d = 2; d <= n; d++) {
        // Clear working buffer
        probs = array_2d(d + 1, threshold);

        // For each face of the new die...
        for (var i = 0; i <= sides; i++) {
            // Sum with old outcomes...
            for (var s = 0; s < oldprobs.length; s++) {
                for (var v = 0; v < oldprobs[s].length; v++) {
                    // Calculate new number of partial/complete successes.
                    var value = v + i;
                    var successes = s;
                    if (value >= threshold) {
                        value = 0;
                        successes++;
                    }
                    probs[successes][value] += die_prob[i] * oldprobs[s][v];
                }
            }
        }
        oldprobs = probs;
    }

    return probs;
}

// Logging and validation
function log_prob_array(label, prob) {
    if (!DEBUG_ENABLED) {
        return;
    }

    console.log('--- ' + label + ' ---');
    if (prob.mortal && prob.normal.length != prob.mortal.length) {
        console.error('Mismatched lengths: ' + prob.normal.length + ' != ' + prob.mortal.length);
    }

    var normal_sum = 0.0;
    var mortal_sum = 0.0;
    for (var w = 0; w < prob.normal.length; w++) {
        console.log(' ' + w + ' = ' + prob.normal[w]);
        if (prob.normal[w] < 0) {
            console.error('Negative probability!');
        }
        normal_sum += prob.normal[w];

        var mortal_row_sum = 0.0;
        for (var m = 0; m < prob.mortal[w].length; m++) {
            console.log('   ' + w + ':' + m + ' = ' + prob.mortal[w][m]);
            if (prob.mortal[w][m] < 0) {
                console.error('Negative probability!');
            }
            mortal_sum += prob.mortal[w][m];
            mortal_row_sum += prob.mortal[w][m];
        }

        if (Math.abs(prob.normal[w] - mortal_row_sum) > 0.0001) {
            console.error('Mortal probabilities do not sum to normal probability: ' + mortal_row_sum + ' != ' + prob.normal[w]);
        }

    }

    if (Math.abs(1.0 - normal_sum) > 0.0001) {
        console.error('Normal probabilities do not sum to 1.0: ' + normal_sum);
    }

    if (prob.mortal && Math.abs(1.0 - mortal_sum) > 0.0001) {
        console.error('Mortal probabilities do not sum to 1.0: ' + mortal_sum);
    }

    console.log('--------------');
}

// Returns a 2d array[i][j] where every index is = 0
function array_2d(i, j) {
    var ret = [];
    for (var a = 0; a < i; a++) {
        ret[a] = [];
        ret[a].length = j;
        ret[a].fill(0);
    }
    return ret;
}

function expected_value(data) {
    var ev = 0.0;
    for(var i = 0; i < data.length; i++) {
        if (data[i]) {
            ev += i * data[i];
        }
    }

    return ev;
}

function graph(raw_data, title, chart_name) {
    // Don't graph in unit tests.
    if (TEST_OVERRIDE) {
        return;
    }

    var labels = [];
    var cumulative_data = [];
    var cumulative_mortal_data = [];
    var cumulative = 100.0;
    var cumulative_mortal = 100.0;
    var data = [];
    var mortal = [];
    var chart = charts[chart_name];

    // Clean up data for graphing.
    var max_length = raw_data.normal.length;
    for(var l = 0; l < max_length; l++) {
        if (raw_data.normal[l] == null) {
            raw_data.normal[l] = 0.0;
        }
        // Generate rounded percentage point values.
        var clean = Math.round(raw_data.normal[l] * 1000) / 10.0;

        data[l] = clean;
        labels[l] = l;
        cumulative_data.push({x: l + 0.5, y: Math.round(cumulative * 10) / 10.0});

        // Decrement cumulative probability.
        // Note that this uses the true value, not the cleaned value.
        if (raw_data.normal[l] != null) {
            cumulative -= raw_data.normal[l] * 100;
        }

        // Mortal wounds are second dimenion and have to be summed across all rows
        if (raw_data.mortal && raw_data.mortal[l]) {
            if (raw_data.mortal[l].length > max_length) {
                max_length = raw_data.mortal[l].length;
            }
            for(var m = 0; m < raw_data.mortal[l].length; m++) {
                if (mortal[m] == null) {
                    mortal[m] = 0.0;
                }
                mortal[m] += raw_data.mortal[l][m];
            }
        }
    }

    // Turn mortal count into percentage points
    var has_mortal = false;
    if (mortal.length <= 1) {
        mortal = [];
    } else {
        for (var m = 0; m < mortal.length; m++) {
            var clean_mortal = Math.round(mortal[m] * 1000) / 10.0;
            if (clean_mortal) {
                has_mortal = true;
            }
            cumulative_mortal_data.push({x: m + 0.5, y: Math.round(cumulative_mortal * 10) / 10.0});
            cumulative_mortal -= mortal[m] * 100;
            mortal[m] = clean_mortal;
        }
    }

    // Drop zeroes off the end
    var max_length = Math.max(data.length, mortal.length);
    while (max_length && (!data[max_length - 1] && !mortal[max_length - 1])) {
        max_length--;
        data.length = max_length;
        mortal.length = max_length;
        labels.length = max_length;
        cumulative_data.length = max_length;
        cumulative_mortal_data.length = max_length;
    }

    // Set start and end points for the cumulative to the chart boundaries.
    if (cumulative_data.length) {
        cumulative_data[0].x = 0;
        cumulative_data[max_length] = {x: max_length, y: 0};
        if (has_mortal) {
            cumulative_mortal_data[0].x = 0;
            cumulative_mortal_data[max_length] = {x: max_length, y: 0};
        }
    }

    // Expected values
    var text = document.getElementById(chart_name + '_text');
    var ev = expected_value(raw_data.normal);
    ev = Math.round(ev * 100) / 100.0;
    text.innerHTML = 'Expected: ' + ev;
    var ev_points = [];
    ev_points.length = Math.floor(ev);
    ev_points.fill({x: 0, y: null});
    ev_points[ev_points.length] = {x:ev, y:100};
    ev_points[ev_points.length] = {x:ev, y:0};

    chart.data.datasets[DATASET_PRIMARY].data = data;
    chart.data.datasets[DATASET_PRIMARY].grouped = has_mortal;
    chart.data.datasets[DATASET_MORTAL].grouped = has_mortal;
    if (has_mortal) {
        chart.data.datasets[DATASET_MORTAL].data = mortal;
        chart.data.datasets[DATASET_CUMULATIVE_MORTAL].data = cumulative_mortal_data;
    } else {
        chart.data.datasets[DATASET_MORTAL].data = [];
        chart.data.datasets[DATASET_CUMULATIVE_MORTAL].data = [];
    }
    chart.data.datasets[DATASET_CUMULATIVE].data = cumulative_data;
    chart.data.datasets[DATASET_EXPECTED].data = ev_points;
    chart.data.labels = labels;
    chart.options.plugins.title.text = title;
    chart.options.scales['linear'].max = data.length;
    chart.options.scales['labels'].max = data.length - 0.5;

    chart.update();
}

var charts = [];


// 40K Init
var fields_40k = ['attacks', 'bs', 'ap', 's', 'd', 't', 'save', 'hit_mod', 'hit_crit', 'wound_mod', 'save_mod', 'invulnerable', 'wounds', 'hit_sus', 'wound_crit', 'fnp'];
var checkboxes_40k = ['cover', 'hit_leth', 'wound_dev'];
var selects_40k = ['hit_of_6', 'hit_reroll', 'wound_of_6', 'wound_reroll', 'save_reroll'];
function init_40k() {
    charts['attack'] = init_chart('attack_chart', 'attacks');
    charts['hit'] = init_chart('hit_chart', 'hits');
    charts['wound'] = init_chart('wound_chart', 'wounds');
    charts['unsaved'] = init_chart('unsaved_chart', 'unsaved');
    charts['damage'] = init_chart('damage_chart', 'damage');
    charts['killed'] = init_chart('killed_chart', 'killed');

    // Populate fields from the parameter string.
    var params = location.hash.substring(1);
    if (params) {
        var pairs = params.split('&');
        if (pairs.length) {
            for (var i = 0; i < pairs.length; i++) {
                var pair = pairs[i].split('=');
                var key = decodeURIComponent(pair[0]);
                var value = decodeURIComponent(pair[1]);
                if (fields_40k.indexOf(key) > -1) {
                    document.getElementById(key).value = value;
                } else if (checkboxes_40k.indexOf(key) > -1) {
                    document.getElementById(key).checked = true;
                } else if (selects_40k.indexOf(key) > -1) {
                    document.getElementById(key).value = value;
                }
            }
            roll_40k();
        }
    }
}

function generate_permalink_40k() {
    var pairs = [];
    for(var i = 0; i < fields_40k.length; i++) {
        if (document.getElementById(fields_40k[i]).value) {
            pairs[pairs.length] = fields_40k[i] + '=' + document.getElementById(fields_40k[i]).value;
        }
    }
    for(var i = 0; i < checkboxes_40k.length; i++) {
        if (document.getElementById(checkboxes_40k[i]).checked) {
            pairs[pairs.length] = checkboxes_40k[i];
        }
    }
    for(var i = 0; i < selects_40k.length; i++) {
        if (document.getElementById(selects_40k[i]).value) {
            pairs[pairs.length] = selects_40k[i] + '=' + document.getElementById(selects_40k[i]).value;;
        }
    }
    var query = pairs.join('&');
    location.hash = query;
}

// AoS Init
var fields_aos = ['attacks', 'hit', 'rend', 'wound', 'd', 'save', 'hit_mod', 'wound_mod', 'save_mod', 'wounds'];
var checkboxes_aos = ['cover'];
var selects_aos = ['hit_of_6', 'hit_reroll', 'wound_of_6', 'wound_reroll', 'save_reroll', 'shake'];
function init_aos() {
    charts['attack'] = init_chart('attack_chart', 'attacks');
    charts['hit'] = init_chart('hit_chart', 'hits');
    charts['wound'] = init_chart('wound_chart', 'wounds');
    charts['unsaved'] = init_chart('unsaved_chart', 'unsaved');
    charts['damage'] = init_chart('damage_chart', 'damage');
    charts['killed'] = init_chart('killed_chart', 'killed');

    // Populate fields from the parameter string.
    var params = location.hash.substring(1);
    if (params) {
        var pairs = params.split('&');
        if (pairs.length) {
            for (var i = 0; i < pairs.length; i++) {
                var pair = pairs[i].split('=');
                var key = decodeURIComponent(pair[0]);
                var value = decodeURIComponent(pair[1]);
                if (fields_aos.indexOf(key) > -1) {
                    document.getElementById(key).value = value;
                } else if (checkboxes_aos.indexOf(key) > -1) {
                    document.getElementById(key).checked = true;
                } else if (selects_aos.indexOf(key) > -1) {
                    document.getElementById(key).value = value;
                }
            }
            roll_aos();
        }
    }
}

function generate_permalink_aos() {
    var pairs = [];
    for(var i = 0; i < fields_aos.length; i++) {
        if (document.getElementById(fields_aos[i]).value) {
            pairs[pairs.length] = fields_aos[i] + '=' + document.getElementById(fields_aos[i]).value;
        }
    }
    for(var i = 0; i < checkboxes_aos.length; i++) {
        if (document.getElementById(checkboxes_aos[i]).checked) {
            pairs[pairs.length] = checkboxes_aos[i];
        }
    }
    for(var i = 0; i < selects_aos.length; i++) {
        if (document.getElementById(selects_aos[i]).value) {
            pairs[pairs.length] = selects_aos[i] + '=' + document.getElementById(selects_aos[i]).value;;
        }
    }
    var query = pairs.join('&');
    location.hash = query;
}

// Shared Init
function init_chart(chart_name, label) {
    var ctx = document.getElementById(chart_name);

    return new Chart(ctx, {
        data: {
            labels: [],
            datasets: [
                {
                    // DATASET_PRIMARY
                    type: 'bar',
                    label: '{n} ' + label + ': ',
                    xAxisID: 'labels',
                    borderColor: 'rgba(128, 0, 128, 1.0)',
                    backgroundColor: 'rgba(128, 0, 128, 0.4)',
                    borderWidth: 1,
                    data: [],
                    order: 3,
                    grouped: false
                }, {
                    // DATASET_MORTAL
                    type: 'bar',
                    label: '{n} mortal: ',
                    xAxisID: 'labels',
                    borderColor: 'rgba(192, 0, 0, 1.0)',
                    backgroundColor: 'rgba(192, 0, 0, 0.4)',
                    borderWidth: 1,
                    data: [],
                    order: 3,
                    grouped: false
                }, {
                    // DATASET_EXPECTED
                    type: 'line',
                    label: 'expected: {n} ' + label,
                    xAxisID: 'linear',
                    borderColor: 'rgba(128, 64, 0, 1.0)',
                    backgroundColor: 'rgba(128, 64, 0, 0.4)',
                    pointBackgroundColor: 'rgba(128, 64, 0, 0.4)',
                    pointStyle: false,
                    data: [],
                    order: 2,
                    type: 'line'
                }, {
                    // DATASET_CUMULATIVE
                    type: 'line',
                    label: '>= {n} ' + label + ': ',
                    xAxisID: 'linear',
                    borderColor: 'rgba(0, 128, 128, 1.0)',
                    backgroundColor: 'rgba(0, 128, 128, 0.1)',
                    pointBackgroundColor: 'rgba(0, 128, 128, 0.4)',
                    borderWidth: 1,
                    pointRadius: 0,
                    pointHoverRadius: 0,
                    fill: 'origin',
                    data: [],
                    order: 1,
                    type: 'line',
                    cubicInterpolationMode: 'monotone'
                }, {
                    // DATASET_CUMULATIVE_MORTAL
                    type: 'line',
                    label: '>= {n} mortal: ',
                    xAxisID: 'linear',
                    borderColor: 'rgba(255, 128, 32, 1.0)',
                    backgroundColor: 'rgba(255, 128, 32, 0.1)',
                    pointBackgroundColor: 'rgba(255, 128, 32, 0.4)',
                    borderWidth: 1,
                    pointRadius: 0,
                    pointHoverRadius: 0,
                    fill: 'origin',
                    data: [],
                    order: 0,
                    type: 'line',
                    cubicInterpolationMode: 'monotone'
                }
            ]
        },
        options: {
            interaction: {
                intersect: false,
                mode: 'index'
            },
            scales: {
                labels: {
                    axis: 'x',
                    type: 'linear',
                    min: -0.5,
                    offset: false,
                    display: false,
                    ticks: {
                        stepSize: 1
                    }
                },
                linear: {
                    axis: 'x',
                    type: 'linear',
                    min: 0,
                    offset: false,
                    display: true,
                    ticks: {
                        stepSize: 1
                    }
                },
                y: {
                    suggestedMax: 100,
                    beginAtZero: true
                }
            },
            plugins: {
                title: {
                    display: true
                },
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        title: function(item) {
                            return '';
                        },
                        label: function(item) {
                            if (item.datasetIndex == DATASET_EXPECTED) {
                                // Expected value
                                if (item.parsed.y == 100) {
                                    return item.dataset.label.replace('{n}', item.parsed.x);
                                } else {
                                    return null;
                                }
                            } else {
                                return item.dataset.label.replace('{n}', Math.floor(item.parsed.x)) + item.parsed.y + '%';
                            }
                        }
                    }
                }
            }
        }
    });
}

// Constants correspond to the chart definitions above.
const DATASET_PRIMARY = 0;
const DATASET_MORTAL = 1;
const DATASET_EXPECTED = 2;
const DATASET_CUMULATIVE = 3;
const DATASET_CUMULATIVE_MORTAL = 4;

var TEST_OVERRIDE = false;
var DEBUG_ENABLED = false;
