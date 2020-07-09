% Request for MWE without any verbal element inside (according to syntactic annotation)

pattern {
  MWE [label];
} without {
  MWE -[parseme=MWE]-> V;
  V[upos=VERB|AUX]
}
