% Gender agreement mismatch Determiner/Noun

pattern {
  N [cat=N, g=*];
  D [cat=D, g=*];
  N -[det]-> D;
  N.g <> D.g;
}
