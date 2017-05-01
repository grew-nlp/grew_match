% For instance, search for a coordination lexical unit which is not the dependent of a "coord" relation

match {
  CC [cat=C, s=c]
}
without {
  X -[coord|root]-> CC;
}
