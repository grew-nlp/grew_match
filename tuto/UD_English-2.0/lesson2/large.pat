% Search for a larger pattern
% ex: a passive construction with a nominal by-agent

pattern {
  V -[aux:pass]-> AP;
  BY [lemma=by];
  V -[obl]-> N;
  N -[case]-> BY;
}
