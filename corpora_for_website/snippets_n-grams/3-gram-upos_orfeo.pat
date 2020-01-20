% Search for trigrams of upos
% For instance: DET, ADJ, NOM

pattern { N1 [upos=DET]; N2 [upos=ADJ]; N3 [upos=NOM]; N1 < N2; N2 < N3 }
