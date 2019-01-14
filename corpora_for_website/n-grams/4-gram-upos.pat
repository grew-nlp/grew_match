% Search for the 4-gram of upos: DET, ADJ, ADJ, NOUN

pattern { N1 [upos=DET]; N2 [upos=ADJ]; N3 [upos=ADJ]; N4 [upos=NOUN]; N1 < N2; N2 < N3; N3 < N4 }
