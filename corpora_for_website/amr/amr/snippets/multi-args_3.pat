% Search for a node which is the source of the 3 relations ARG0, ARG1 and ARG2, all cases
% The clause "N -[ARG1]-> *" is a constraint saying "N" must have an "ARG1" outgoing edge with out really matching the target of this relation.
% The following pattern finds all possible cases.

pattern {
	N -[ARG0]-> A;
	N -[ARG1]-> *;
	N -[ARG2]-> *;
}
