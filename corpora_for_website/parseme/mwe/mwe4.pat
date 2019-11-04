% MWE with 4 words

pattern {
  MWE [label];
  MWE -[MWE]-> N1; MWE -[MWE]-> N2; MWE -[MWE]-> N3; MWE -[MWE]-> N4; MWE -[MWE]-> N5;
  N1 << N2; N2 << N3; N3 << N4; N4 << N5;
}
without { MWE -[MWE]-> X }
