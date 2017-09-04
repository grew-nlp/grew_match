% Number agreement mismatch Determiner/Noun

pattern {
  N [cat=N, n=*];
  D [cat=D, n=*];
  N -[det]-> D;
  N.n <> D.n;
}
