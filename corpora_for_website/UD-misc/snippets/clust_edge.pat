% What are the dependency relations between a VERB and a NOUN?
% NOTE: it is required to give a name ('e' here) to the edge to make reference to it as a cluster key

pattern { e: GOV -> DEP; GOV[upos=VERB]; DEP[upos=NOUN] }
