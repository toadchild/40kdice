
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
function success_chance(stat, modifier) {
    var ret = {};

    // No stat means auto-succeed, but nothing special triggers.
    if (isNaN(stat)) {
        ret.pass_chance = 1.0;
        ret.fail_chance = 0.0;
        ret.natural_fail_chance = 0.0;
        ret.six_chance = 0.0;
        return ret;
    }

    if (isNaN(modifier)) {
        modifier = 0;
    }

    // Put stat in sane limits (2-7).
    if (stat < 2) {
        stat = 2;
    } else if (stat > 7) {
        stat = 7;
    }

    // Apply modifier to stat naively.
    var modded_stat = stat - modifier;

    // Put modded stat in sane limits (2-7).
    if (modded_stat < 2) {
        modded_stat = 2;
    } else if (modded_stat > 7) {
        modded_stat = 7;
    }
    ret.pass_chance = (7 - modded_stat) / 6.0;
    ret.fail_chance = 1.0 - ret.pass_chance;

    // Modifiers are applied to the die roll, not the stat.
    // So if you have a -1, both 1 and 2 are treated as a result of 1
    // Similarly, if you have a +1, rolls of 1 and 2 are both treated as a 2.

    // Rerolls, however, only care about the natural values.
    // So a reroll of 1 is always a natural 1 and 'reroll failed' will not
    // give you more rerolls for having taken a penalty.  However, reroll
    // effects are 'may reroll', so you won't be forced to reroll a die that
    // passes due to positive modifiers.

    if (modifier > 0) {
        // Rerolls are optional, so only reroll things that will really fail.
        ret.natural_fail_chance = 1.0 - (7 - modded_stat) / 6.0;

        // Positive modifiers increase 6+ range.
        // Smallest die roll that counts as a result of 6 or more.
        var six_threshold = Math.max(modded_stat, 6 - modifier);
        ret.six_chance = (7 - six_threshold) / 6.0;
    } else if (modifier < 0) {
        // Unmodified fail chance.
        ret.natural_fail_chance = 1.0 - (7 - stat) / 6.0;

        // negative modifiers eliminate results of 6+.
        ret.six_chance = 0.0;
    } else {
        ret.natural_fail_chance = ret.fail_chance;
        ret.six_chance = 1.0 / 6.0;
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
    
    ret.pass_chance = prob.pass_chance + prob.natural_fail_chance * prob.pass_chance;
    ret.fail_chance = 1.0 - ret.pass_chance;
    ret.six_chance = prob.six_chance + prob.natural_fail_chance * prob.six_chance;

    return ret;
}

// Shake off damage
// Returns a prob array reflecting the chance to ignore wounds.
function shake_damage(damage_prob, shake) {
    var results = [];
    results.length = damage_prob.length;
    results.fill(0.0);
    results[0] = damage_prob[0];

    if (shake == '6' || shake == '56' || shake == '2x6') {
        // Most abilities shake off individual points of damage
        var shake_prob;
        if (shake == '6') {
            // Single roll of 6
            shake_prob = 1.0 / 6.0;
        } else if (shake == '2x6') {
            // Roll of at least one 6 on 2 dice
            shake_prob = 11.0 / 36.0;
        } else if (shake == '56') {
            // Single roll of 5 or 6
            shake_prob = 1.0 / 3.0;
        }

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
    } else if (shake == 'quantum') {
        // Quantum Shielding ignores all damage if a single die rolls
        // under the damage amount.
        
        // Can't roll less than 1.
        if (damage_prob.length > 1) {
            results[1] = damage_prob[1];
        }

        // For damage values of 2 - 6, increasing chances of being negated.
        for(var d = 2; d < damage_prob.length; d++) {
            if (d > 6) {
                // Damage > 6 should be impossible, but will always fail.
                results[0] += damage_prob[d];
            } else {
                // Chance to negate depends on d
                var negate_chance = (d - 1) / 6.0;

                results[0] += damage_prob[d] * negate_chance;
                results[d] = damage_prob[d] * (1 - negate_chance);
            }
        }
    } else {
        // No shake effect
        results = damage_prob;
    }

    return results;
}

function roll() {
    // Number of attacks

    var hit_dice = fetch_value('attacks');
    var attacks = dice_sum_prob_array(hit_dice);
    var attack_title = hit_dice + ' attacks';

    graph(attacks, attack_title, 'attack');

    // Hits

    var hit_stat = fetch_int_value('bs');
    var hit_mod = fetch_int_value('hit_mod');
    var hit_prob = success_chance(hit_stat, hit_mod);
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
    var hit_reroll = fetch_value('hit_reroll');
    if (hit_reroll == 'fail') {
        hit_title += ', reroll misses';
        hit_prob = reroll(hit_prob);
    } else if (hit_reroll == '1') {
        hit_title += ', reroll 1s';
        hit_prob = reroll_1(hit_prob);
    }

    // Apply probability filter
    var hits = filter_prob_array(attacks, hit_prob.pass_chance);

    // Hit of six generates extra hits
    var hit_of_6 = fetch_value('hit_of_6');
    if (hit_of_6) {
        // Probability of a six given that we hit.
        var six_prob = hit_prob.six_chance / hit_prob.pass_chance;
        var bonus_hits = 0;
        var bonus_hit_prob = 0;

        if (hit_of_6 == '2') {
            hit_title += ', 6s do 3 hits';
            bonus_hits = 2;
            bonus_hit_prob = 1.0;
        } else if (hit_of_6 == '1roll') {
            hit_title += ', 6s add 1 hit roll';
            bonus_hits = 1;
            bonus_hit_prob = hit_prob.pass_chance;
        }

        // Take hits from each column and move them to the right.
        // Have to start from the top, or we'll apply to hits we already shifted up.
        // Also don't apply to misses.
        for (var h = hits.normal.length - 1; h > 0; h--) {
            if (hits.normal[h] > 0) {
                // We may decrement this multiple times.  Need to keep the original reference.
                var original_h_prob = hits.normal[h];

                // Use binomial theorem to find out how likely it is to get n sixes on h dice.
                for (var n = 1; n <= h; n++) {
                    var n_six_hit_prob = prob(h, n, six_prob);

                    // Binomial again to see how many of the bonus hits hit.
                    for (var b = 1; b <= bonus_hits * n; b++) {
                        var b_prob = prob(bonus_hits * n, b, bonus_hit_prob);
                        if (b_prob) {
                            var target = h + b;
                            var six_delta = original_h_prob * n_six_hit_prob * b_prob;
                            hits.normal[h] -= six_delta;
                            if (hits.normal[target] == null) {
                                hits.normal[target] = 0;
                            }
                            hits.normal[target] += six_delta;
                        }
                    }
                }
            }
        }
    }

    graph(hits, hit_title, 'hit');

    // Wounds

    var s = fetch_int_value('s');
    var t = fetch_int_value('t');
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

    var wound_prob = success_chance(wound_stat);
    var wound_title;
    if (wound_prob.pass_chance == 1) {
        wound_title = 'auto-wound';
    } else {
        wound_title = 'wound on ' + wound_stat + '+';
    }

    // Rerolls
    var wound_reroll = fetch_value('wound_reroll');
    if (wound_reroll == 'fail') {
        wound_title += ', reroll misses';
        wound_prob = reroll(wound_prob);
    } else if (wound_reroll == '1') {
        wound_title += ', reroll 1s';
        wound_prob = reroll_1(wound_prob);
    }

    // Apply probability filter
    var wounds = filter_prob_array(hits, wound_prob.pass_chance);

    // Calculate odds of getting extra mortal wounds.
    // Is a set of probability arrays keyed on the number of wounds.
    var wound_of_6 = fetch_value('wound_of_6');
    // Probability of a six given that we wound.
    var wound_six_chance = wound_prob.six_chance / wound_prob.pass_chance;
    for (var w = 0; w < wounds.normal.length; w++) {
        if (wound_of_6 == '+mortal') {
            // Use binomial theorem to find out how likely it is to get n sixes on w dice.
            for (var n = 0; n <= w; n++) {
                var n_six_prob = prob(w, n, wound_six_chance);

                if (wounds.mortal[w][n] == null) {
                    wounds.mortal[w][n] = 0;
                }
                wounds.mortal[w][n] += n_six_prob;
                wounds.mortal[w][0] -= n_six_prob;
            }
        } else {
            wounds.mortal[w][0] = 1;
        }
    }

    graph(wounds, wound_title, 'wound');

    // Saves

    var save_stat = fetch_int_value('save');
    var invuln_stat = fetch_int_value('invulnerable');
    var ap_val = fetch_int_value('ap');
    var save_mod = fetch_int_value('save_mod');
    var cover = is_checked('cover');
    var save_reroll = fetch_value('save_reroll');
    // Always treat AP as negative
    ap_val = -Math.abs(ap_val);
    if (isNaN(save_mod)) {
        save_mod = 0;
    }
    if (isNaN(ap_val)) {
        ap_val = 0;
    }
    var total_save_mod = save_mod + ap_val;
    if (cover) {
        total_save_mod++;
    }
    var use_invuln = false;

    // Auto-fail the save if no save stat given.
    if (isNaN(save_stat)) {
        save_stat = 100;
    }
    if (isNaN(invuln_stat)) {
        invuln_stat = 100;
    }

    // Normal save.
    var save_prob = success_chance(save_stat, total_save_mod);
    var save_title = 'save of ' + save_stat + '+';
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

    // Invulnerable save; ignores AP and cover, but includes other modifiers.
    var invuln_prob = success_chance(invuln_stat, save_mod);
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

    // wounds of 6 get -1 additional AP
    if (wound_of_6 == '-1' || wound_of_6 == '-3' || wound_of_6 == '-4') {
        // Probability of a six given that we wound.
        var six_prob = wound_prob.six_chance / wound_prob.pass_chance;
        var ap_mod = parseInt(wound_of_6, 10);

        // calculate save chance with modified AP.
        var ap_save_prob = success_chance(save_stat, total_save_mod + ap_mod);
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
        save_prob.pass_chance = six_prob * ap_save_prob.pass_chance + (1 - six_prob) * save_prob.pass_chance;
        save_prob.fail_chance = six_prob * ap_save_prob.fail_chance + (1 - six_prob) * save_prob.fail_chance;
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

    if (save_prob.fail_chance == 1) {
        unsaved_title = 'auto-fail save';
    }

    graph(unsaved, unsaved_title, 'unsaved');

    // Damage

    var damage_val = fetch_value('d');
    var damage_title = damage_val + ' damage';
    var wound_val = fetch_int_value('wounds');
    var shake = fetch_value('shake');
    if (shake) {
        if (shake == '6') {
            damage_title += ' (shake on 6)';
        } else if (shake == '2x6') {
            damage_title += ' (2x shake on 6)';
        } else if (shake == '56') {
            damage_title += ' (shake on 5,6)';
        } else if (shake == 'quantum') {
            damage_title += ' (quantum shield)';
        }
    }

    var damage_prob = dice_sum_prob_array(damage_val).normal;
    damage_prob = shake_damage(damage_prob, shake);
    if (wound_val) {
        damage_prob = clamp_prob_array(damage_prob, wound_val);
    }

    // Change of a mortal wound going through.
    var mortal_damage_chance = shake_damage([0, 1], shake)[1];

    var damage = {'normal': []};
    // Apply damage based on how many hits there are.
    for(var i = 0; i < unsaved.normal.length; i++) {
        // Generate damage array for this many impacts.
        var hit_damage = [1];
        if (i > 0) {
            hit_damage = roll_n_dice(i, damage_prob);
        }

        // Add to the damage output, scaled by our current probability.
        for (var j = 0; j < hit_damage.length; j++) {
            // Add extra damage points for mortal wounds.
            for (var m = 0; m < unsaved.mortal[i].length; m++) {
                for (var n = 0; n <= m; n++) {
                    var n_mortal_prob = prob(m, n, mortal_damage_chance);

                    if (damage.normal[j + n] == null) {
                        damage.normal[j + n] = 0;
                    }
                    damage.normal[j + n] += unsaved.normal[i] * hit_damage[j] * unsaved.mortal[i][m] * n_mortal_prob;
                }
            }
        }
    }

    graph(damage, damage_title, 'damage');

    // Models Killed

    var killed = {'normal': []};
    var killed_title = 'models killed';
    if (wound_val) {
        // We're just dividing the damage done by the number of wounds.
        // Damage values are already clamped to the maximum number of
        // wounds a model has.
        for (var d = 0; d < damage.normal.length; d++) {
            if (damage.normal[d] == null) {
                continue;
            }
            var kills = Math.floor(d / wound_val);
            if (killed.normal[kills] == null) {
                killed.normal[kills] = 0;
            }
            killed.normal[kills] += damage.normal[d];
        }
    }

    graph(killed, killed_title, 'killed');

    generate_permalink();
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
        if (input_probs.normal[i] == null) {
            input_probs.normal[i] = 0;
        }
        if (input_probs.mortal[i] == null) {
            input_probs.mortal[i] = [1];
        }

        // merge into master list based on how likely this many trials were
        for(var r = 0; r <= i; r++) {
            var trial_result = prob(i, r, probability);

            if (results.normal[r] == null) {
                results.normal[r] = 0;
                results.mortal[r] = [];
            }
            results.normal[r] += input_probs.normal[i] * trial_result;

            for (var m = 0; m < input_probs.mortal[i].length; m++) {
                if (results.mortal[r][m] == null) {
                    results.mortal[r][m] = 0;
                }
                results.mortal[r][m] += input_probs.mortal[i][m] * input_probs.normal[i] * trial_result;
            }
        }
    }

    // Renormalize the mortal wounds per category
    for (var r = 0; r < results.mortal.length; r++) {
        for (var m = 0; m < results.mortal[r].length; m++) {
            results.mortal[r][m] /= results.normal[r];
        }
    }

    return results;
}

// Returns a probability array for a specified number of dice in nDs notation.
// Will also return a constant probability array if no 'd' is present.
function dice_sum_prob_array(value) {
    var die_prob = {'normal': [], 'mortal': []};
    var i = value.toLowerCase().indexOf('d');
    // No 'd', return constant probability.
    if (i == -1) {
        die_prob.normal.length = value;
        die_prob.normal.fill(0);
        die_prob.normal[die_prob.normal.length] = 1;
        return die_prob;
    }
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

    die_prob.normal = roll_n_dice(n, die_faces);
    return die_prob;
}

// Roll n dice with the given probability distribution.
// http://ghostlords.com/2008/03/dice-rolling-2/
// Modified to support dice with non-uniform probabilities.
// Note that this includes dice that can roll a result of 0!
function roll_n_dice(n, die_prob) {
    // Make a pair of buffers.  Preload the values for 1 die in each.
    // We only enter the loop for 2+ dice.
    var counts = [];
    var oldcounts = [];
    var sides = die_prob.length - 1;
    counts.length = n * sides + 1;
    oldcounts.length = n * sides + 1;
    counts.fill(0);
    oldcounts.fill(0);
    for (var i = 0; i <= sides; i++) {
        counts[i] = die_prob[i];
        oldcounts[i] = die_prob[i];
    }

    for (var d = 2; d <= n; d++) {
        // Clear working buffer
        counts = [];
        counts.length = n * sides + 1;
        counts.fill(0);

        // For each face of the new die...
        for (var i = 0; i <= sides; i++) {
            // Sum with old outcomes...
            for (var j = 0; j <= (d - 1) * sides; j++) {
                // Combine probabilities of [i] and [j] to get [i+j]
                counts[i + j] += die_prob[i] * oldcounts[j];
            }
        }
        oldcounts = counts;
    }

    return counts;
}

// Returns a probability array clamped to maximum value 'max'.
// All probabilities > max are added into max.
function clamp_prob_array(prob, max) {
    results = [];
    for (var i = 0; i < prob.length; i++) {
        if (i <= max) {
            results[i] = prob[i];
        } else {
            if (results[max] == null) {
                results[max] = 0;
            }
            results[max] += prob[i];
        }
    }

    return results;
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
    var labels = [];
    var cumulative_data = [];
    var cumulative = 100.0;
    var data = [];
    var mortal = [];
    var chart = charts[chart_name];

    // Clean up data for graphing.
    for(var l = 0; l < raw_data.normal.length; l++) {
        if (raw_data.normal[l] == null) {
            raw_data.normal[l] = 0.0;
        }
        // Generate rounded percentage point values.
        var clean = Math.round(raw_data.normal[l] * 1000) / 10.0;

        data[l] = clean;
        labels[l] = l;
        cumulative_data[l] = {x: l, y: Math.round(cumulative * 10) / 10.0};

        // Decrement cumulative probability.
        // Note that this uses the true value, not the cleaned value.
        if (raw_data.normal[l] != null) {
            cumulative -= raw_data.normal[l] * 100;
        }

        // Mortal wounds are second dimenion and have to be summed across all rows
        if (raw_data.mortal && raw_data.mortal[l]) {
            for(var m = 1; m < raw_data.mortal[l].length; m++) {
                if (mortal[m] == null) {
                    mortal[m] = 0.0;
                }
                mortal[m] += raw_data.normal[l] * raw_data.mortal[l][m];
            }
        }
    }

    // Turn mortal count into percentage points
    //chart.options.scales.xAxes[AXIS_LABELS].categoryPercentage = 1.6
    if (mortal.length <= 1) {
        mortal = [];
    } else {
        for (var m = 0; m < mortal.length; m++) {
            mortal[m] = Math.round(mortal[m] * 1000) / 10.0;
        }
    }

    // Drop zeroes off the end
    var max_length = Math.max(data.length, mortal.length);
    while (max_length && (!data[max_length - 1] && !mortal[max_length - 1])) {
        max_length--;
        data.length = max_length;
        mortal.length = max_length;
        cumulative_data.length = max_length;
        labels.length = max_length;
    }
    cumulative_data.push({x: cumulative_data.length, y: 0});

    // Expected values
    var text = document.getElementById(chart_name + '_text');
    var ev = expected_value(raw_data.normal);
    ev = Math.round(ev * 100) / 100.0;
    text.innerHTML = 'Expected: ' + ev;
    var ev_points = [{x:ev, y:0}, {x:ev, y:100}];

    chart.data.datasets[DATASET_PRIMARY].data = data;
    chart.data.datasets[DATASET_MORTAL].data = mortal;
    chart.data.datasets[DATASET_CUMULATIVE].data = cumulative_data;
    chart.data.datasets[DATASET_EXPECTED].data = ev_points;
    chart.data.labels = labels;
    chart.options.title.text = title;
    chart.options.scales.xAxes[AXIS_LINEAR].ticks.max = data.length;
    chart.update();
}

var charts = [];

function init() {
    charts['attack'] = init_chart('attack_chart', '{n} attacks: ', '>= {n} attacks: ', 'expected: {n} attacks');
    charts['hit'] = init_chart('hit_chart', '{n} hits: ', '>= {n} hits: ', 'expected: {n} hits');
    charts['wound'] = init_chart('wound_chart', '{n} wounds: ', '>= {n} wounds: ', 'expected: {n} wounds');
    charts['unsaved'] = init_chart('unsaved_chart', '{n} unsaved: ', '>= {n} unsaved: ', 'expected: {n} unsaved');
    charts['damage'] = init_chart('damage_chart', '{n} damage: ', '>= {n} damage: ', 'expected: {n} damage');
    charts['killed'] = init_chart('killed_chart', '{n} killed: ', '>= {n} killed: ', 'expected: {n} killed');

    // Populate fields from the parameter string.
    var params = location.hash.substring(1);
    if (params) {
        var pairs = params.split('&');
        if (pairs.length) {
            for (var i = 0; i < pairs.length; i++) {
                var pair = pairs[i].split('=');
                var key = decodeURIComponent(pair[0]);
                var value = decodeURIComponent(pair[1]);
                if (fields.indexOf(key) > -1) {
                    document.getElementById(key).value = value;
                } else if (checkboxes.indexOf(key) > -1) {
                    document.getElementById(key).checked = true;
                } else if (selects.indexOf(key) > -1) {
                    document.getElementById(key).value = value;
                }
            }
            roll();
        }
    }
}

var fields = ['attacks', 'bs', 'ap', 's', 'd', 't', 'save', 'hit_mod', 'save_mod', 'invulnerable', 'wounds'];
var checkboxes = ['cover'];
var selects = ['hit_of_6', 'hit_reroll', 'wound_of_6', 'wound_reroll', 'save_reroll', 'shake'];
function generate_permalink() {
    var pairs = [];
    for(var i = 0; i < fields.length; i++) {
        if (document.getElementById(fields[i]).value) {
            pairs[pairs.length] = fields[i] + '=' + document.getElementById(fields[i]).value;
        }
    }
    for(var i = 0; i < checkboxes.length; i++) {
        if (document.getElementById(checkboxes[i]).checked) {
            pairs[pairs.length] = checkboxes[i];
        }
    }
    for(var i = 0; i < selects.length; i++) {
        if (document.getElementById(selects[i]).value) {
            pairs[pairs.length] = selects[i] + '=' + document.getElementById(selects[i]).value;;
        }
    }
    var query = pairs.join('&');
    location.hash = query;
}

function init_chart(chart_name, bar_label, line_label, ev_label) {
    var ctx = document.getElementById(chart_name);
    var mortal_label = '{n} mortal: ';

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                {
                    label: bar_label,
                    xAxisID: 'labels',
                    borderColor: 'rgba(128, 0, 128, 0.4)',
                    backgroundColor: 'rgba(128, 0, 128, 0.4)',
                    data: [],
                    stack: 'a'
                }, {
                    label: mortal_label,
                    xAxisID: 'labels',
                    borderColor: 'rgba(192, 0, 0, 0.4)',
                    backgroundColor: 'rgba(192, 0, 0, 0.4)',
                    data: [],
                    stack: 'a'
                }, {
                    label: line_label,
                    xAxisID: 'linear',
                    borderColor: 'rgba(0, 128, 128, 0.4)',
                    backgroundColor: 'rgba(0, 128, 128, 0.2)',
                    pointBackgroundColor: 'rgba(0, 128, 128, 0.4)',
                    data: [],
                    type: 'line',
                    cubicInterpolationMode: 'monotone'
                }, {
                    label: ev_label,
                    xAxisID: 'linear',
                    borderColor: 'rgba(128, 64, 0, 0.4)',
                    backgroundColor: 'rgba(128, 64, 0, 0.4)',
                    pointBackgroundColor: 'rgba(128, 64, 0, 0.4)',
                    data: [],
                    type: 'line'
                }
            ]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                        min: 0
                    }
                }],
                xAxes: [
                    {
                        id: 'labels',
                        ticks: {
                            maxRotation: 0
                        },
                        stacked: true
                    },
                    {
                        id: 'linear',
                        type: 'linear',
                        display: false,
                        ticks: {
                            min: 0
                        }
                    }
                ]
            },
            title: {
                display: true
            },
            legend: {
                display: false
            },
            tooltips: {
                callbacks: {
                    title: function(itemArray, chart) {
                        return '';
                    },
                    label: function(item, chart) {
                        if (item.datasetIndex == DATASET_EXPECTED) {
                            // Expected value
                            return chart.datasets[item.datasetIndex].label.replace('{n}', item.xLabel);
                        } else {
                            return chart.datasets[item.datasetIndex].label.replace('{n}', item.xLabel) + item.yLabel + '%';
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
const DATASET_CUMULATIVE = 2;
const DATASET_EXPECTED = 3;

const AXIS_LABELS = 0;
const AXIS_LINEAR = 1;
