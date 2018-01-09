% Constraint on positions in the sentence
% Below, we search for a verb with a postponed subject

pattern {
  V [ upos=VERB ];
  V -[nsubj|nsubj:pass]-> S;
  V << S;                      % V is on the left of S
}
