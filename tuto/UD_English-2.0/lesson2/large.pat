% Search for a larger pattern
% ex: a passive construction with a nominal by-agent

match {
  V -[aux:pass]-> AP;
  BY [lemma=by];
  V -[obl]-> N;
  N -[case]-> BY;
}
