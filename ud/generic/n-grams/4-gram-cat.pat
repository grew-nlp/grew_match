% Search for the bigram of categories: DET, ADJ, ADJ, NOUN

match { N1 [cat=DET]; N2 [cat=ADJ]; N3 [cat=ADJ]; N4 [cat=NOUN]; N1 < N2; N2 < N3; N3 < N4 }
