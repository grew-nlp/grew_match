% MWE with 3 words

pattern {
  MWE [label];
  MWE -[MWE]-> N1; MWE -[MWE]-> N2; MWE -[MWE]-> N3;
  N1 << N2; N2 << N3;
}
without { MWE -[MWE]-> X }
