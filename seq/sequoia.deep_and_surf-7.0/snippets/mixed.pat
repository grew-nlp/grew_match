% Search for both a category and a relation (for instance, an adjective with a determiner)

match {
  ADJ [cat=A];
  ADJ -[det]-> DET;
}
