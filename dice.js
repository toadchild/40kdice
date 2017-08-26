
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
        ret.one_chance = 0.0;
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
    // This is significant when it comes to reroll abilities.

    if (modifier > 0) {
        // positive modifiers eliminate result of 1 and increase 6+ range.
        ret.one_chance = 0.0;

        // Smallest die roll that counts as a result of 6.
        var six_threshold = Math.max(modded_stat, 6 - modifier);
        ret.six_chance = (7 - six_threshold) / 6.0;
    } else if (modifier < 0) {
        // negative modifiers eliminate results of 6 and increase 1 range.
        ret.six_chance = 0.0;

        // Largest die roll that counts as a result of 1.
        var one_threshold = Math.min(6, 1 - modifier);
        ret.one_chance = one_threshold / 6.0;
    } else {
        ret.one_chance = 1.0 / 6.0;
        ret.six_chance = 1.0 / 6.0;
    }

    return ret;
}

// Reroll 1s
// Returns new success probability struct with updated values.
function reroll_1(prob){
    var ret = {};
    
    ret.pass_chance = prob.pass_chance + prob.one_chance * prob.pass_chance;
    ret.fail_chance = prob.fail_chance - prob.one_chance * prob.pass_chance;
    ret.one_chance = prob.one_chance * prob.one_chance;
    ret.six_chance = prob.six_chance + prob.one_chance * prob.six_chance;

    return ret;
}

// Reroll all failed rolls
// Returns new success probability struct with updated values.
function reroll(prob){
    var ret = {};
    
    ret.pass_chance = prob.pass_chance + prob.fail_chance * prob.pass_chance;
    ret.fail_chance = prob.fail_chance * prob.fail_chance;
    ret.one_chance = prob.fail_chance * prob.one_chance;
    ret.six_chance = prob.six_chance + prob.fail_chance * prob.six_chance;

    return ret;
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
    var hit_reroll_1 = is_checked('hit_reroll_1');
    var hit_reroll = is_checked('hit_reroll');
    if (hit_reroll) {
        hit_title += ', reroll misses';
        hit_prob = reroll(hit_prob);
    } else if (hit_reroll_1) {
        hit_title += ', reroll 1s';
        hit_prob = reroll_1(hit_prob);
    }

    // Apply probability filter
    var hits = filter_prob_array(attacks, hit_prob.pass_chance);

    // Hit of six generates extra hits
    var triple_hit_on_6 = is_checked('triple_hit_on_6');
    if (triple_hit_on_6) {
        hit_title += ', 6s do 3 hits';
        // Probability of a six given that we hit.
        var six_prob = hit_prob.six_chance / hit_prob.pass_chance;

        // Take hits from each column and move them two columns to the right.
        // Have to start from the top, or we'll apply to hits we already shifted up.
        // Also don't apply to misses.
        for (var h = hits.length - 1; h > 0; h--) {
            if (hits[h] > 0) {
                // We may decrement this multiple times.  Need to keep the original reference.
                var original_h_prob = hits[h];

                // Use binomial theorem to find out how likely it is to get n sixes on h dice.
                for (var n = 1; n <= h; n++) {
                    var six_hits = prob(h, n, six_prob);

                    // Move the hit from this column to [h + 2 * n]
                    var six_delta = original_h_prob * six_hits;
                    hits[h] -= six_delta;
                    if (hits[h + 2 * n] == null) {
                        hits[h + 2 * n] = 0;
                    }
                    hits[h + 2 * n] += six_delta;
                }
            }
        }
    }

    graph(hits, hit_title, 'hit');

    // Wounds

    var s = fetch_int_value('s');
    var t = fetch_int_value('t');
    var wound_stat;
    if (t >= s * 2) {
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
    var wound_reroll_1 = is_checked('wound_reroll_1');
    var wound_reroll = is_checked('wound_reroll');
    if (wound_reroll) {
        wound_title += ', reroll misses';
        wound_prob = reroll(wound_prob);
    } else if (wound_reroll_1) {
        wound_title += ', reroll 1s';
        wound_prob = reroll_1(wound_prob);
    }

    // Apply probability filter
    var wounds = filter_prob_array(hits, wound_prob.pass_chance);

    graph(wounds, wound_title, 'wound');

    // Saves

    var save_stat = fetch_int_value('save');
    var invuln_stat = fetch_int_value('invulnerable');
    var ap_val = fetch_int_value('ap');
    var save_mod = fetch_int_value('save_mod');
    var cover = is_checked('cover');
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

    // Invulnerable save ignores AP and cover bonus, but not other modifiers.
    if (isNaN(save_stat) || save_stat - total_save_mod > invuln_stat - save_mod) {
        save_stat = invuln_stat;
        total_save_mod = save_mod;
        use_invuln = true;
    }

    // Auto-fail the save if no save stat given.
    if (isNaN(save_stat)) {
        save_stat = 100;
    }

    var saved_prob = success_chance(save_stat, total_save_mod);
    var unsaved = filter_prob_array(wounds, saved_prob.fail_chance);
    var unsaved_title;
    if (saved_prob.fail_chance == 1) {
        unsaved_title = 'auto-fail save';
    } else {
        unsaved_title = 'save of ' + save_stat + '+';
        if (use_invuln) {
            unsaved_title += '+';
        }
        if (total_save_mod) {
            var sign = '';
            if (total_save_mod > 0) {
                sign = '+';
            }
            unsaved_title += ' (' + sign + total_save_mod + ')';
        }
    }

    graph(unsaved, unsaved_title, 'unsaved');

    // Damage

    var damage_val = fetch_value('d');
    var damage;
    if (damage_val.indexOf('d') == -1) {
        // If fixed damage, just multiply by the number of hits.
        var damage_prob = constant_prob_array(damage_val);
        damage = multiply_prob_arrays(unsaved, damage_prob);
    } else {
        // For variable damage, apply damage based on how many hits there are.
        // For example, 3 hits at d6 damage is 3d6 damage, not d6 damage * 3.
        damage = [];
        damage[0] = unsaved[0];
        for(var i = 1; i < unsaved.length; i++) {
            // Generate damage array for this many impacts.
            hit_damage = dice_sum_prob_array(damage_val, i);
            // Add to the damage output, scaled by our current probability.
            for (var j = 0; j < hit_damage.length; j++) {
                if (!damage[j]) {
                    damage[j] = 0;
                }
                damage[j] += unsaved[i] * hit_damage[j];
            }
        }
    }
    var damage_title = 'damage dealt';

    graph(damage, damage_title, 'damage');

    generate_permalink();
}

// Binomial expansion.
function binom(n, k) {
    // n! / (k! * (n-k)!)
    var numerator = 1;
    for (var i = n - k + 1; i <= n; i++) {
        numerator *= i;
    }
    var denominator = 1;
    for (var j = 2; j <= k; j++) {
        denominator *= j;
    }

    return numerator / denominator;
}

// Probability of successes given a number of trials and a probability.
function prob(trials, successes, probability) {
    return binom(trials, successes) * Math.pow(probability, successes) * Math.pow(1 - probability, trials - successes);
}

// Creates an array that has the probability of n successes stored in [n].
function prob_array(trials, probability) {
    var results = [];
    for(var successes = 0; successes <= trials; successes++) {
        results[successes] = prob(trials, successes, probability);
    }
    return results;
}

// Takes a probability array, returns new probability array reduced by the
// specified probability of success.
function filter_prob_array(input_probs, probability) {
    var results = [];
    for(var i = 0; i < input_probs.length; i++) {
        if (input_probs[i] == null) {
            continue;
        }
        // all outcomes given this many trials
        var trial_results = prob_array(i, probability);
        // merge into master list based on how likely this many trials were
        for(var r = 0; r < trial_results.length; r++) {
            if (results[r] == null) {
                results[r] = 0;
            }
            results[r] += input_probs[i] * trial_results[r];
        }
    }
    return results
}

// Takes two probability arrays, returns a new probability array made by
// multiplying all values by each other.
function multiply_prob_arrays(first, second) {
    var results = [];
    for (var i = 0; i < first.length; i++) {
        for (var j = 0; j < second.length; j++) {
            var r = i * j;
            var val = first[i] * second[j];
            if (results[r] == null) {
                results[r] = 0;
            }
            results[r] += val;
        }
    }

    return results;
}

// Returns a probability array for a specific guaranteed number.
function constant_prob_array(n) {
    var results = [];
    results.length = n;
    results.fill(0);
    results[results.length] = 1;
    return results;
}

// Returns a probability array for a specified number of dice in nDs notation.
// Will also return a constant probability array if no 'd' is present.
function dice_sum_prob_array(value, multiplier) {
    var i = value.toLowerCase().indexOf('d');
    // No 'd', return constant probability.
    if (i == -1) {
        return constant_prob_array(value);
    }
    var n = parseInt(value.substring(0, i), 10);
    if (isNaN(n) || n <= 0) {
        n = 1;
    }
    if (multiplier) {
        n *= multiplier;
    }
    var s = parseInt(value.substring(i + 1), 10);
    if (isNaN(s) || s <= 0) {
        s = 1;
    }

    // We are rolling n s-sided dice.
    // Count the ways: http://ghostlords.com/2008/03/dice-rolling-2/

    var numresults = Math.pow(s, n);

    // Make a pair of buffers.  Preload the values for 1 die in each.
    // We only enter the loop for 2+ dice.
    var counts = [];
    var oldcounts = [];
    counts.length = n * s + 1;
    oldcounts.length = n * s + 1;
    counts.fill(0);
    oldcounts.fill(0);
    for (var i = 1; i <= s; i++) {
        counts[i] = 1;
        oldcounts[i] = 1;
    }

    for (var d = 2; d <= n; d++) {
        // Clear working buffer
        counts = [];
        counts.length = s * n + 1;
        counts.fill(0);

        // For each face of the new die...
        for (var i = 1; i <= s; i++) {
            // Sum with old outcomes...
            for (var j = d - 1; j <= (d - 1) * s; j++) {
                // We have found oldcounts[j] new ways to reach i+j.
                counts[i + j] += oldcounts[j];
            }
        }
        oldcounts = counts;
    }

    // Now turn the counts into probabilities.
    var results = [];
    for (var i = 0; i < counts.length; i++) {
        results[i] = counts[i] / numresults;
    }

    return results;
}

function clean_graph_data(data) {
    var clean = [];

    for (var i = 0; i < data.length; i++) {
    }

    // Drop zeroes off the end
    while (clean.length && (clean[clean.length - 1] == 0)) {
        clean.length--;
    }

    return clean;
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
    var chart = charts[chart_name];

    // Clean up data for graphing.
    for(var l = 0; l < raw_data.length; l++) {
        // Generate rounded percentage point values.
        var clean = Math.round(raw_data[l] * 1000) / 10.0;

        // Skip values of 0
        if (clean > 0) {
            var i = data.length;
            data[i] = clean;
            labels[i] = l;
            cumulative_data[i] = Math.round(cumulative * 10) / 10.0;
        }

        // Decrement cumulative probability.
        // Note that this uses the true value, not the cleaned value.
        if (raw_data[l] != null) {
            cumulative -= raw_data[l] * 100;
        }
    }

    chart.data.datasets[0].data = data;
    chart.data.datasets[1].data = cumulative_data;
    chart.data.labels = labels;
    chart.options.title.text = title;
    chart.update();

    // Expected values
    var text = document.getElementById(chart_name + '_text');
    var ev = expected_value(raw_data);
    ev = Math.round(ev * 100) / 100.0;
    text.innerHTML = 'Expected: ' + ev;
}

var charts = [];

function init() {
    charts['attack'] = init_chart('attack_chart', '% n attacks', '% >= n attacks');
    charts['hit'] = init_chart('hit_chart', '% n hits', '% >= n hits');
    charts['wound'] = init_chart('wound_chart', '% n wounds', '% >= n wounds');
    charts['unsaved'] = init_chart('unsaved_chart', '% n unsaved', '% >= n unsaved');
    charts['damage'] = init_chart('damage_chart', '% n damage', '% >= n damage');

    // Populate fields from the parameter string.
    var params = location.search.substring(1);
    if (params) {
        var pairs = location.search.substring(1).split('&');
        if (pairs.length) {
            for (var i = 0; i < pairs.length; i++) {
                var pair = pairs[i].split('=');
                var key = decodeURIComponent(pair[0]);
                var value = decodeURIComponent(pair[1]);
                if (fields.indexOf(key) > -1) {
                    document.getElementById(key).value = value;
                } else if (checkboxes.indexOf(key) > -1) {
                    document.getElementById(key).checked = true;
                }
            }
            roll();
        }
    }
}

var fields = ['attacks', 'bs', 'ap', 's', 'd', 't', 'save', 'hit_mod', 'save_mod', 'invulnerable'];
var checkboxes = ['triple_hit_on_6', 'cover', 'hit_reroll_1', 'hit_reroll', 'wound_reroll_1', 'wound_reroll'];
function generate_permalink() {
    var pairs = [];
    for(var i = 0; i < fields.length; i++) {
        pairs[pairs.length] = fields[i] + '=' + document.getElementById(fields[i]).value;
    }
    for(var i = 0; i < checkboxes.length; i++) {
        if (document.getElementById(checkboxes[i]).checked) {
            pairs[pairs.length] = checkboxes[i];
        }
    }
    var query = pairs.join('&');
    var urlbase = location.href.split('?')[0];
    document.getElementById('permalink').href = urlbase + '?' + query;
}

function init_chart(chart_name, bar_label, line_label) {
    var ctx = document.getElementById(chart_name);
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: bar_label,
                data: []
            }, {
                label: line_label,
                data: [],
                type: 'line'
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero:true,
                        min: 0
                    }
                }]
            },
            title: {
                display: true
            },
            legend: {
                display: false
            }
        }
    });
}
