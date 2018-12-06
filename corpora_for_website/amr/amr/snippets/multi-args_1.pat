% Search for a node which is the source of the 3 relations
% Note: the matching algorithm implies that N0, N1 and N2 are 3 distinct nodes

pattern {
	N -[ARG0]-> N0;
	N -[ARG1]-> N1;
	N -[ARG2]-> N2;
}
