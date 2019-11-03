% Search for bigrams DET + NOUN without the relation 'det' beetween the two nodes

pattern { N1 [upos=DET]; N2 [upos=NOUN]; N1 < N2 }
without { N2 -[det]-> N1}
