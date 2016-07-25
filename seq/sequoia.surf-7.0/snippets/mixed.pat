% Search for both a category and a relation (for instance, a preposition used as a determiner)

match {
  PREP [cat=P];
  X -[det]-> PREP;
}