% MWE with 2 words

pattern {
  MWE [label];
  MWE -[MWE]-> N1; MWE -[MWE]-> N2;  % <--- two nodes N1 and N2 linked to the MWE node
  N1 << N2;                          % <--- do not display permutation of another result
}
without { MWE -[MWE]-> X }           % <--- avoid a third node linked to the MWE node
