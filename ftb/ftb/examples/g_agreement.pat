% Gender agreement mismatch Determiner/Noun

match {
  N [cat=N, g=*];
  D [cat=D, g=*];
  N -[det]-> D;
  N.g <> D.g;
}
