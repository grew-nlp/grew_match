% Search for a MWE with a given 2 given phonological forms

pattern {
  MWE [label];                                  % Search for a MWE node…
  MWE -[parseme=MWE]-> N1; N1 [form="Word_1"];  % …which contains a token with phonological form "Word_1"…
  MWE -[parseme=MWE]-> N2; N2 [form="Word_2"];  % …and a token with phonological form "Word_2"
}

% Note that this will also return MWE with other tokens than the two givens.
% See next examples for the usage of "without" clauses to avoid this.