% Number agreement mismatch Determiner/Noun

match {
  N [cat=N, n=*];
  D [cat=D, n=*];
  N -[det]-> D;
  N.n <> D.n;
}
