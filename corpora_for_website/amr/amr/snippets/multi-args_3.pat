% Search for a node which is the source of the 3 relations
% With the star notation, the targets of relations may be identical or not

pattern {
	N []; % node N must be declared separatly because next clauses are just constraints applied to the matched nodes
	N -[ARG0]-> *;
	N -[ARG1]-> *;
	N -[ARG2]-> *;
}
