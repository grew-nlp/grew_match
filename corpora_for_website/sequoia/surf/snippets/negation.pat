% For instance, search for a coordination token which is not the dependent of a "coord" relation

pattern {
  CC [upos=C, s=c]
}
without {
  X -[coord|root]-> CC;
}
