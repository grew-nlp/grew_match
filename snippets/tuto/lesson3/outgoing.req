% With the "*" symbol, it is possible to request that some outgoing edge exists
% In the example below, only occurencies of the verb "make" with an outgoing subject edge are given

pattern { N [ upos=VERB, lemma="make"]; N -[nsubj]-> *; }

% Warning: the clause "N -[nsubj]-> *" is not equivalent to the clause "N -[nsubj]-> X":
% the first is just a additional constraint, the second match a new node "X"
