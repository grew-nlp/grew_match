% Search for a node which is the source of the 3 relations ARG0, ARG1 and ARG2
% The matching algorithm implies that N0, N1 and N2 are 3 distinct nodes.
% A solution where N0 = N1 is not found by this pattern.
% See next snippet for a way to do this

pattern {
	N -[ARG0]-> N0;
	N -[ARG1]-> N1;
	N -[ARG2]-> N2;
}
