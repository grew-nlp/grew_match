% MWE with only 1 word

pattern {
  MWE [label];
  MWE -[MWE]-> N;
}
without { MWE -[MWE]-> X }
