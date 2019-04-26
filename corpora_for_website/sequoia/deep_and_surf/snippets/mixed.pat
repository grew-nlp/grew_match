% Search for both a category and a relation (for instance, an adjective with a determiner)

pattern {
  ADJ [upos=A];
  ADJ -[det]-> DET;
}
