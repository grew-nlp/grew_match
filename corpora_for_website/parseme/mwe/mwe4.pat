% MWE with 4 words

pattern {
  MWE [label];
  MWE -[parseme=MWE]-> N1; MWE -[parseme=MWE]-> N2; MWE -[parseme=MWE]-> N3; MWE -[parseme=MWE]-> N4;
  N1 << N2; N2 << N3; N3 << N4;
}
without { MWE -[parseme=MWE]-> X }
