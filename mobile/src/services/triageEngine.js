function read(answer, field) {
  return answer[field];
}

function conditionMatches(condition, answers) {
  const value = read(answers, condition.field);
  if ('equals' in condition) return value === condition.equals;
  if ('includes' in condition) return Array.isArray(value) && value.includes(condition.includes);
  if ('in' in condition) return condition.in.includes(value);
  return false;
}

function ruleMatches(rule, answers) {
  const all = rule.all ? rule.all.every((c) => conditionMatches(c, answers)) : true;
  const any = rule.any ? rule.any.some((c) => conditionMatches(c, answers)) : true;
  return all && any;
}

export function runTriage(ruleSet, answers, translate) {
  const redFlags = ['breathing_difficulty', 'chest_pain', 'severe_bleeding', 'unconscious'];
  if (redFlags.some((flag) => answers[flag] === true) || (answers.pregnant && answers.pregnancy_danger)) {
    const redRule = [...ruleSet.rules].sort((a, b) => b.priority - a.priority).find((rule) => rule.color === 'RED' && ruleMatches(rule, answers));
    return {
      color: 'RED',
      severity: 'severe',
      advice: translate(redRule?.adviceKey || 'advice_red'),
      reasons: [translate(redRule?.reasonKey || 'reason_severe')]
    };
  }
  const matched = [...ruleSet.rules].sort((a, b) => b.priority - a.priority).find((rule) => ruleMatches(rule, answers));
  if (!matched || !answers.symptoms?.length) {
    return { color: 'YELLOW', severity: 'medium', advice: translate('unsure'), reasons: [translate('unsure')] };
  }
  return {
    color: matched.color,
    severity: matched.color === 'GREEN' ? 'mild' : 'medium',
    advice: translate(matched.adviceKey),
    reasons: [translate(matched.reasonKey)]
  };
}
