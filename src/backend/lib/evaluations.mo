import Types "../types/evaluations";

module {
  /// Computes (totalScore, averageScore) from a set of criterion scores.
  /// totalScore is the weight-normalised score on a 0-100 scale; averageScore
  /// is the plain mean of the per-criterion percentages. Both are 0 when no
  /// criteria are supplied.
  public func computeScores(criteria : [Types.CriterionScore]) : (Nat, Nat) {
    if (criteria.size() == 0) {
      return (0, 0);
    };

    var weightedSum : Nat = 0;
    var weightTotal : Nat = 0;
    var percentSum : Nat = 0;

    for (c in criteria.values()) {
      let maxScore = if (c.maxScore == 0) { 1 } else { c.maxScore };
      let percent = (c.score * 100) / maxScore;
      weightedSum += percent * c.weight;
      weightTotal += c.weight;
      percentSum += percent;
    };

    let totalScore : Nat = if (weightTotal == 0) {
      percentSum / criteria.size();
    } else {
      weightedSum / weightTotal;
    };
    let averageScore : Nat = percentSum / criteria.size();

    (totalScore, averageScore);
  };
};
