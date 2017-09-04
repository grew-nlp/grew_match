% Search for the bigram of categories: DET, ADJ, NOUN

pattern { N1 [cat=DET]; N2 [cat=ADJ]; N3 [cat=NOUN]; N1 < N2; N2 < N3 }
