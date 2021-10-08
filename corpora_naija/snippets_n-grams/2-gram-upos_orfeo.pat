% Search for bigrams of upos
% For instance: DET, NOM

pattern { N1 [upos=DET]; N2 [upos=NOM]; N1 < N2 }
