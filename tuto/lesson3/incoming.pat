% With the "*" symbol, it is possible to request that some incoming edge exists
% In the example below, only occurencies of the verb "make" with an incoming edge roots are given

pattern { N [ upos=VERB, lemma="make"]; * -[root]-> N; }

% Warning: the clause "* -[root]-> N" is not equivalent to the clause "X -[root]-> N":
% the first is just a additional constraint, the second match a new node "X"
