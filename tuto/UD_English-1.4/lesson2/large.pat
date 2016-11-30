% Search for a larger pattern
% ex: a passive construction with a nominal by-agent

match {
  V -[auxpass]-> AP;
  BY [lemma=by];
  V -[nmod]-> N;
  N -[case]-> BY;
}
