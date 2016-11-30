% Constraint on positions in the sentence
% Below, we search for a verb with a postponed subject

match {
  V [ cat=VERB ];
  V -[nsubj|nsubjpass]-> S;
  S >> V;
}
