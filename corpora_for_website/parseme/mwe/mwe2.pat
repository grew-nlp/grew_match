% MWE with 2 words

pattern {
  MWE [label];
  MWE -[parseme=MWE]-> N1; MWE -[parseme=MWE]-> N2;  % <--- two nodes N1 and N2 linked to the MWE node
  N1 << N2;                                          % <--- do not display permutation of another result
}
without { MWE -[parseme=MWE]-> X }                   % <--- avoid a third node linked to the MWE node
