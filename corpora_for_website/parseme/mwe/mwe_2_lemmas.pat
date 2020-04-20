% Search for a MWE with a given 2 given lemmas

pattern {
  MWE [label];                           % Search for a MWE node…
  MWE -[MWE]-> N1; N1 [lemma="Lemma_1"]; % …which contains a token with "Lemma_1"…
  MWE -[MWE]-> N2; N2 [lemma="Lemma_2"]; % …and a token with "Lemma_2"
}

% Note that this will also return MWE with other tokens than the two givens.
% See next examples for the usage of "without" clauses to avoid this.